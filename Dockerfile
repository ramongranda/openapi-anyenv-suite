# syntax=docker/dockerfile:1.6
FROM node:22-alpine
WORKDIR /work

# 1) deps (fast + cacheable)
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --prefer-offline || npm i --no-audit --no-fund

# 2) only what's needed for the tools (scripts, rules)
COPY scripts ./scripts
COPY .spectral.yaml ./.spectral.yaml
COPY rules ./rules

CMD ["npm","run","doctor"]

