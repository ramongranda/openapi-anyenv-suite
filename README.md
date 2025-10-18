
# OpenAPI Any‑Env Suite + Quality Grade (Windows / Linux / WSL / Docker)

All‑in‑one toolkit with **latest pinned versions**:

- **@stoplight/spectral-cli 6.15.0** — style/rules lint
- **@redocly/cli 2.7.0** — bundle, preview, optional schema lint

Adds **API Quality Grader (A–E)** on top of your validation pipeline.

> Redocly v2 is ESM‑only. Use Node **20.19.0+** or **22.12.0+**.

## Quick start

### Install (local binaries)

```bash
npm install   # or: npm ci (if you keep package-lock.json)
```

### Validate (bundle → Spectral lint)

```bash
npm run validate -- path/to/openapi.yaml
# Windows PowerShell/CMD:
npm run validate -- "C:\path\to\openapi.yaml"
```

Optional schema check with Redocly:

```bash
SCHEMA_LINT=1 npm run validate -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; npm run validate -- "C:\path\to\openapi.yaml"
```

### Grade (A–E)

```bash
npm run grade -- path/to/openapi.yaml
# Enable schema lint within grading:
SCHEMA_LINT=1 npm run grade -- path/to/openapi.yaml
```

Outputs a detailed JSON report at **`dist/grade-report.json`** and prints the final score and grade.

### Preview docs

```bash
npm run preview -- path/to/openapi.yaml --port 8080
```

### npx (no local install)

```bash
npm run validate:npx -- path/to/openapi.yaml
npm run grade:npx -- path/to/openapi.yaml
npm run bundle:npx -- path/to/openapi.yaml --out dist/bundled.yaml
npm run preview:npx -- path/to/openapi.yaml --port 8080
```

## Makefile (optional; Linux/WSL/Git Bash)

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

## Quality grading rules (editable)

- Start at **100**.
- **Penalties**
  - Spectral: error −4 (max −40), warn −1 (max −15)
  - Redocly (if enabled): error −5 (max −25), warn −2 (max −10)
- **Bonuses** (max +20)
  - `info.title` +2, `info.version` +2, `servers` +1
  - ≥80% operations with `summary` +5
  - ≥80% operations with `description` +5
  - ≥70% operations with any **4xx** response +5
  - `components.securitySchemes` present +3
- Clamp to **0–100** → map to **A (≥90), B (≥80), C (≥65), D (≥50), E (<50)**.

## Docker (BuildKit / buildx)

### Recommended: Build with BuildKit (no more legacy warning)

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

### Using buildx (best practice)

```bash
docker buildx create --name devbuilder --use
docker buildx inspect --bootstrap
docker buildx build -t openapi-tools . --load   # --push to publish
```

### Run

```bash
# Validate
docker run --rm -v "$PWD:/work" openapi-tools npm run validate -- /work/openapi.yaml
# With schema lint
docker run --rm -e SCHEMA_LINT=1 -v "$PWD:/work" openapi-tools npm run validate -- /work/openapi.yaml
# Grade
docker run --rm -v "$PWD:/work" openapi-tools npm run grade -- /work/openapi.yaml
# Preview
docker run --rm -p 8080:8080 -v "$PWD:/work" openapi-tools npm run preview -- /work/openapi.yaml --port 8080
```

## Common pitfalls

- Pass the spec **after `--`** when using npm scripts.
- On Windows, if `node_modules` is locked: close editors/watchers, run `npx rimraf node_modules` and retry.
- Ensure Node satisfies Redocly v2 requirement (20.19.0+ or 22.12.0+).

Badges: ![Node.js](https://img.shields.io/badge/node-%3E%3D20.19%2B-blue) ![Spectral](https://img.shields.io/badge/Spectral-6.15.0-orange) ![Redocly](https://img.shields.io/badge/Redocly-2.6.0-red) ![Docker](https://img.shields.io/badge/runtime-Docker-blue)
