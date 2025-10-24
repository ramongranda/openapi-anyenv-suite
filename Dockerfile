# syntax=docker/dockerfile:1.6
FROM node:22-alpine
WORKDIR /work

# 1) deps (fast + cacheable)
COPY package.json pnpm-lock.yaml* ./
# Use Corepack to ensure pnpm is available and install with frozen lockfile
RUN npm i -g pnpm@8 --silent && \
	pnpm install --no-frozen-lockfile --prod --shamefully-hoist

# 2) copy scripts and rules needed at runtime
COPY scripts ./scripts
COPY .spectral.yaml ./.spectral.yaml
COPY rules ./rules
COPY templates ./templates

# Add a tiny entrypoint script that supports 'check' and 'report'
RUN chmod +x ./scripts/docker-entry.sh

ENTRYPOINT ["/work/scripts/docker-entry.sh"]
CMD ["--help"]

