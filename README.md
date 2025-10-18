# OpenAPI Any-Env Suite + Quality Grade (Windows / Linux / WSL / Docker)

![Node.js](https://img.shields.io/badge/node-%E2%89%A520.19-blue) ![Spectral](https://img.shields.io/badge/Spectral-6.15.0-orange) ![Redocly](https://img.shields.io/badge/Redocly-2.7.0-red) ![Docker](https://img.shields.io/badge/runtime-Docker-blue)

[![Docker Publish](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml/badge.svg?branch=master)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml)
[![Docker Smoke Test](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-smoke-test.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-smoke-test.yml)
[![Release](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/release.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/release.yml)
[![Version](https://img.shields.io/github/v/tag/ramongranda/openapi-anyenv-suite?label=version&sort=semver)](https://github.com/ramongranda/openapi-anyenv-suite/releases)
[![npm](https://img.shields.io/npm/v/openapi-anyenv-suite?logo=npm&label=npm)](https://www.npmjs.com/package/openapi-anyenv-suite)
[![npm downloads](https://img.shields.io/npm/dm/openapi-anyenv-suite?logo=npm)](https://www.npmjs.com/package/openapi-anyenv-suite)
[![GHCR](https://img.shields.io/badge/GHCR-openapi--anyenv--suite-24292e?logo=github)](https://ghcr.io/ramongranda/openapi-anyenv-suite)
[![GHCR Tag](https://img.shields.io/github/v/tag/ramongranda/openapi-anyenv-suite?label=ghcr%20tag&sort=semver)](https://ghcr.io/ramongranda/openapi-anyenv-suite)
[![Platforms](https://img.shields.io/badge/platforms-linux%2Famd64%20%7C%20linux%2Farm64-2ea44f)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml)

All-in-one toolkit to bundle, lint, preview, and grade OpenAPI specs. Ships with pinned tool versions and an opinionated Spectral ruleset, plus an A-E quality grade on top of your validation pipeline.

- Local tools: `@stoplight/spectral-cli` 6.15.0, `@redocly/cli` 2.7.0
- npx tools: pinned or latest depending on script (see Usage)

Note: Redocly CLI v2 is ESM‑only. Use Node 20.19.0+ or 22.12.0+.

## Quick Start

### Requirements

- Node.js 20.19.0+ or 22.12.0+
- npm

### Install (local binaries)

```bash
npm install    # or: npm ci if you keep package-lock.json
```

### Validate (bundle + Spectral lint)

```bash
npm run validate -- path/to/openapi.yaml
# Windows PowerShell/CMD:
npm run validate -- "C:\\path\\to\\openapi.yaml"
```

Optional schema check with Redocly:

```bash
SCHEMA_LINT=1 npm run validate -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; npm run validate -- "C:\\path\\to\\openapi.yaml"
```

### Grade (A–E)

```bash
npm run grade -- path/to/openapi.yaml
# Enable schema lint within grading
SCHEMA_LINT=1 npm run grade -- path/to/openapi.yaml
```

Outputs a detailed JSON report at `dist/grade-report.json` and prints the final score and grade.

### Preview Docs

```bash
npm run preview -- path/to/openapi.yaml --port 8080
```

### Swagger UI Preview

```bash
npm run swagger -- path/to/openapi.yaml --port 8080
# Opens Swagger UI at http://127.0.0.1:8080/swagger.html
```

npx variant (no local install)

```bash
npm run swagger:npx -- path/to/openapi.yaml --port 8080
```

### Try It (example spec included)

```bash
# Validate, grade, and preview the bundled example
npm run validate -- example/openapi.yaml
npm run grade -- example/openapi.yaml
npm run preview -- example/openapi.yaml --port 8080
```

### npx (no local install)

```bash
npm run validate:npx -- path/to/openapi.yaml
npm run grade:npx -- path/to/openapi.yaml
npm run bundle:npx -- path/to/openapi.yaml --out dist/bundled.yaml
npm run preview:npx -- path/to/openapi.yaml --port 8080
```

### Install from npm (CLI)

Global install provides convenient CLI commands:

```bash
npm i -g openapi-anyenv-suite

# Validate
openapi-validate path/to/openapi.yaml

# Grade
SCHEMA_LINT=1 openapi-grade path/to/openapi.yaml

# Preview (Redocly docs)
openapi-preview path/to/openapi.yaml --port 8080

# Swagger UI
openapi-swagger path/to/openapi.yaml --port 8080

# Bundle
openapi-bundle path/to/openapi.yaml --out dist/bundled-openapi.yaml
```

Local install alternative:

```bash
npm i --save-dev openapi-anyenv-suite
npx -p openapi-anyenv-suite openapi-validate path/to/openapi.yaml
```

Notes:

- `validate:npx`/`bundle:npx` currently pin Redocly CLI 2.6.0; `grade:npx`/`preview:npx` use `@latest`.
- Prefer local installs for fully reproducible results.

### Makefile (Linux/WSL/Git Bash)

```bash
make validate path/to/openapi.yaml
SCHEMA_LINT=1 make validate path/to/openapi.yaml
make grade path/to/openapi.yaml
SCHEMA_LINT=1 make grade path/to/openapi.yaml
make bundle path/to/openapi.yaml OUT=dist/my-bundle.yaml
make preview path/to/openapi.yaml PORT=8080

# npx variants
make validate-npx path/to/openapi.yaml
make grade-npx path/to/openapi.yaml
make bundle-npx path/to/openapi.yaml OUT=dist/my-bundle.yaml
make preview-npx path/to/openapi.yaml PORT=8080
```

## Grading Model (Editable)

- Start at 100.
- Penalties
  - Spectral: error −4 (max −40), warn −1 (max −15)
  - Redocly (if enabled): error −5 (max −25), warn −2 (max −10)
- Bonuses (max +20)
  - `info.title` +2, `info.version` +2, `servers` +1
  - ≥80% operations with `summary` +5
  - ≥80% operations with `description` +5
  - ≥70% operations with any 4xx response +5
  - `components.securitySchemes` present +3
- Clamp to 0–100, then map to A (≥90), B (≥80), C (≥65), D (≥50), E (<50).

Environment flags influencing grading:

- `SCHEMA_LINT=1` includes Redocly schema lint in the score.
- `GRADE_SOFT=1` does not fail the process even if errors exist (soft mode).
- `DEBUG_JSON=1` writes raw linter outputs to `dist/debug-*.txt` if parsing fails.

## Spectral Ruleset

Primary ruleset: `.spectral.yaml`, extending `spectral:oas` and local rule packs:

- `rules/core.yaml` — paths/naming, documentation, tags, schemas
- `rules/business.yaml` — error handling, enums, naming, caching
- `rules/format.yaml` — content types, request/response rules, data formats
- `rules/pagination.yaml` — array bounds and pagination consistency
- `rules/security.yaml` — HTTPS, auth, security responses, numeric ranges

Custom functions (CommonJS) are under `rules/functions/`:

- `validateDateTimeFormat.js` — enforce `date`/`date-time` for temporal strings
- `validatePropertyHasExample.js` — suggest examples on important properties
- `validateResponseHasExample.js` — require examples for 2xx responses (unless `$ref`)
- `maxGteMin.js` — validate numeric range coherence

You can tweak or disable rules directly in the YAML files or `.spectral.yaml`.

### Customize Rules Quickly

- Change severity in `.spectral.yaml` (overrides from extended packs):

  ```yaml
  rules:
    operation-description: error   # was warn
    server-https: off              # disable
  ```

- Add a custom function:
  1) Drop `rules/functions/myRule.js` and export a function `(input, context) => issues|undefined`.
  2) Reference it in `rules/*.yaml` under `functions:` and use it in `rules:`.
  3) Ensure `.spectral.yaml` `functionsDir` points to `./rules/functions`.

## Docker (BuildKit / buildx)

### Recommended: Build with BuildKit

- Linux/WSL:

  ```bash
  export DOCKER_BUILDKIT=1
  docker build -t openapi-tools .
  ```

- Windows PowerShell:

  ```powershell
  $env:DOCKER_BUILDKIT=1
  docker build -t openapi-tools .
  ```

### Using buildx

```bash
docker buildx create --name devbuilder --use
docker buildx inspect --bootstrap
docker buildx build -t openapi-tools . --load   # use --push to publish
```

### Prebuilt image (GHCR)

Public pulls require no auth. Replace `:latest` with a tag if desired.

```bash
# Pull
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:latest
# Or use the package.json version tag (published automatically)
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:v1.0.1

# Validate (mount spec read-only; outputs to ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run validate -- /spec/openapi.yaml

# Validate with Redocly schema lint
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run validate -- /spec/openapi.yaml

# Grade (report written to host ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run grade -- /spec/openapi.yaml

# Preview docs (serve on host port 8080)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run preview -- /spec/openapi.yaml --port 8080
  
# Swagger UI (opens /swagger.html)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run swagger -- /spec/openapi.yaml --port 8080
```

Notes
- Images are tagged as `latest` and also as `v<package.json version>`.
- The `v<version>` tag is created automatically on version bumps in package.json. Current: `v1.0.1`.

#### Quick test with the bundled example

From the repository root, run against `example/openapi.yaml`:

```bash
# Validate
docker run --rm \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run validate -- /spec/openapi.yaml

# Grade (with schema lint)
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run grade -- /spec/openapi.yaml

# Preview docs
docker run --rm -p 8080:8080 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:latest \
  npm run preview -- /spec/openapi.yaml --port 8080
```

### Run

```bash
# Validate (mount spec read-only; outputs to ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  openapi-tools \
  npm run validate -- /spec/openapi.yaml

# With schema lint
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  openapi-tools \
  npm run validate -- /spec/openapi.yaml

# Grade
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  openapi-tools \
  npm run grade -- /spec/openapi.yaml

# Preview
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  openapi-tools \
  npm run preview -- /spec/openapi.yaml --port 8080
  
# Swagger UI (opens /swagger.html)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  openapi-tools \
  npm run swagger -- /spec/openapi.yaml --port 8080
```

## CI Usage (example)

GitHub Actions example for validation and grading:

```yaml
name: API Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run validate -- path/to/openapi.yaml
      - run: SCHEMA_LINT=1 npm run grade -- path/to/openapi.yaml
```

## Repository Layout

- `scripts/` — Node scripts for bundle, validate, preview, grade
- `rules/` — Spectral rule packs and custom functions
- `.spectral.yaml` — root ruleset extending local packs
- `dist/` — output folder for bundles, reports, and preview assets

## Utilities

- `npm run doctor` - prints Node/Spectral/Redocly versions

## Tips & Troubleshooting

- Always pass the spec path after `--` when using npm scripts.
- On Windows, if `node_modules` is locked: close watchers/editors, run `npx rimraf node_modules`, then reinstall.
- Ensure Node version satisfies Redocly v2 requirement (20.19.0+ or 22.12.0+).

## Reusable CI Workflows

- Validate: use `ramongranda/openapi-anyenv-suite/.github/workflows/openapi-validate.yml@master`
- Grade: use `ramongranda/openapi-anyenv-suite/.github/workflows/openapi-grade.yml@master`
- Docs: use `ramongranda/openapi-anyenv-suite/.github/workflows/openapi-docs.yml@master`

See `docs/CI.md` for complete usage, inputs, and the Jenkins pipeline example.

## Release Process

- Branching: develop is the integration branch; master holds releases.
- Feature work targets branches off develop; merge to develop via PR.
- To release to master, open a PR into master. The release label is applied automatically based on Conventional Commits (title/commits). If no clear signal is found, the default is `release:minor`.
  - `release:major` when a breaking change is detected (`!`/`BREAKING CHANGE`)
  - `release:minor` for features or as default
  - `release:patch` may be used explicitly if you want a patch bump
- On merge, Auto Version workflow:
  - Runs `npm version <type>` on master, commits and tags `v<version>`
  - Triggers Release, Docker publish to GHCR (tags: `v<version>`, `latest`), and the Docker smoke test.
- The version‑bump PR check is skipped when a release label is present.
