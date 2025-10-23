# syntax=docker/dockerfile:1.6
FROM node:22-alpine
WORKDIR /work


# 1) deps (fast + cacheable)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate \
    && pnpm install --frozen-lockfile


# 2) only what's needed for the tools (scripts, rules)
COPY scripts ./scripts
COPY .spectral.yaml ./.spectral.yaml
COPY rules ./rules

CMD ["pnpm","run","doctor"]

