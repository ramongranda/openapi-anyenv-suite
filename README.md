# OpenAPI AnyEnv Suite

OpenAPI AnyEnv Suite is a collection of tools to bundle, lint, grade and produce reports for OpenAPI specifications. It is designed for local use, CI (GitHub Actions / Jenkins) and Docker containers.

![OAS logo](assets/logo-oas.png)

Badges

![Node.js](https://img.shields.io/badge/node-%E2%89%A520.19-blue) ![Spectral](https://img.shields.io/badge/Spectral-6.15.0-orange) ![Redocly](https://img.shields.io/badge/Redocly-2.7.0-red) ![Docker](https://img.shields.io/badge/runtime-Docker-blue)

Summary

- Local tools: `@stoplight/spectral-cli` (Spectral) and `@redocly/cli` (Redocly). Redocly v2 is ESM-only and requires Node 20.19.0+ or 22.12.0+.
- Produces two main artifacts: `dist/grade-report.json` (machine-readable) and `dist/grade-report.html` (human-friendly).
- `pnpm` is the recommended package manager for reproducibility.

## Quick Start

### Requirements

- Node.js 20.19.0+ or 22.12.0+
- pnpm

### Environment Flags

- `SCHEMA_LINT=1` — include Redocly schema lint (if available) in validate/grade and factor it into scoring.
- `GRADE_SOFT=1` — force a zero exit code even when errors are present (useful for non-blocking CI reports).
- `DEBUG_JSON=1` — write raw linter output to `dist/debug-*.txt` when parsing fails.

### Install (local)

```bash
pnpm install    # or: pnpm install --frozen-lockfile
```

## Usage

Validate (bundle + Spectral):

```bash
pnpm run validate -- path/to/openapi.yaml
# PowerShell/CMD on Windows:
pnpm run validate -- "C:\path\to\openapi.yaml"
```

Optional Redocly schema check:

```bash
SCHEMA_LINT=1 pnpm run validate -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; pnpm run validate -- "C:\path\to\openapi.yaml"
```

Grade (A–E):

```bash
pnpm run grade -- path/to/openapi.yaml
SCHEMA_LINT=1 pnpm run grade -- path/to/openapi.yaml
```

Main outputs:
- `dist/grade-report.json` — JSON with scores, penalties, and linter results.
- `dist/grade-report.html` — HTML report.

Serve the HTML report:

```bash
openapi-grade-report path/to/openapi.yaml --port 8080
# Open: http://127.0.0.1:8080/grade-report.html
```

Branding: set `REPORT_LOGO` or `GRADE_LOGO_URL` to show a custom logo in the report (accepts an http(s) URL or a local path).

## Grading model

Grading is driven by `grade.config.json` in the repository root. If the file is missing, built-in defaults are used.

Example structure (summary):

```json
{
  "penalties": { "spectral": { "error": 4, "warning": 1 }, "redocly": { "error": 5, "warning": 2 } },
  "bonuses": { "max": 20, "rules": { "info.title": 2 } },
  "grades": { "A": 90, "B": 80, "C": 65, "D": 50 }
}
```

## Spectral rules

The repo includes local rule packs in `rules/` and a root `.spectral.yaml` extending `spectral:oas`.

## Docker

Build the image (BuildKit recommended):

```bash
export DOCKER_BUILDKIT=1
docker build -t openapi-tools .
```

Prebuilt images are available on GHCR (tagged by version and `latest`). Mount `grade.config.json` to customize grading in Docker.

## CI (GitHub Actions / Jenkins)

Reusable workflows live in `.github/workflows/`. See `docs/CI.md` for a Jenkins example.

Recommendations:

- Run tests first, then lint/grade in workflows.
- Use `pnpm` on runners and enable Corepack in Jenkins agents when needed.

## Testing

This project uses Jest. Run tests locally:

```bash
pnpm test
```

## Contributing

- Read `CONTRIBUTING.md` for development guidelines and style rules.
- Run `pnpm test` and keep lint checks passing before opening PRs.

---

For more details and examples check the `docs/` folder.
# OpenAPI AnyEnv Suite

Este proyecto es una herramienta para validar, calificar y generar reportes de especificaciones OpenAPI.

OpenAPI AnyEnv Suite es una colección de herramientas para empaquetar, linting, calificar y generar reportes de especificaciones OpenAPI. Está pensada para usarse tanto localmente como en CI (GitHub Actions / Jenkins) y en contenedores Docker.

![OAS logo](assets/logo-oas.png)

Badges

![Node.js](https://img.shields.io/badge/node-%E2%89%A520.19-blue) ![Spectral](https://img.shields.io/badge/Spectral-6.15.0-orange) ![Redocly](https://img.shields.io/badge/Redocly-2.7.0-red) ![Docker](https://img.shields.io/badge/runtime-Docker-blue)

[![Run Tests](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/test.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/test.yml)

Resumen

- Local tools: `@stoplight/spectral-cli` (Spectral) y `@redocly/cli` (Redocly). Redocly v2 es ESM-only y requiere Node 20.19.0+ o 22.12.0+.
- Genera dos artefactos principales: `dist/grade-report.json` (máquina) y `dist/grade-report.html` (humano).
- Preferimos `pnpm` como gestor de paquetes para reproducibilidad.

Contenido principal

- Quick Start
- Uso (validate / grade / report)
- Modelo de calificación
- Reglas de Spectral
- Docker
- CI (GitHub Actions / Jenkins)
- Contribuir y tests

## Inicio rápido

### Requisitos

- Node.js 20.19.0+ o 22.12.0+
- pnpm

### Flags de entorno

- `SCHEMA_LINT=1` — incluye la verificación de esquema de Redocly (si está disponible) en validate/grade y la incorpora en la puntuación.
- `GRADE_SOFT=1` — fuerza salida con código 0 incluso si hay errores (útil para CI no bloqueante).
- `DEBUG_JSON=1` — escribe las salidas sin procesar de los linters en `dist/debug-*.txt` si falla el parseo.

### Instalación (local)

```bash
pnpm install    # o: pnpm install --frozen-lockfile
```

## Uso

Validar (empaquetar + Spectral):

```bash
pnpm run validate -- path/to/openapi.yaml
# PowerShell/CMD en Windows:
pnpm run validate -- "C:\path\to\openapi.yaml"
```

Con comprobación opcional de esquema (Redocly):

```bash
SCHEMA_LINT=1 pnpm run validate -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; pnpm run validate -- "C:\path\to\openapi.yaml"
```

Calificar (A–E):

```bash
pnpm run grade -- path/to/openapi.yaml
SCHEMA_LINT=1 pnpm run grade -- path/to/openapi.yaml
```

Salidas principales:
- `dist/grade-report.json` — JSON con detalles de puntajes, penalizaciones y resultados de linters.
- `dist/grade-report.html` — reporte HTML legible.

Servir el reporte HTML:

```bash
openapi-grade-report path/to/openapi.yaml --port 8080
# Abra: http://127.0.0.1:8080/grade-report.html
```

Branding: use `REPORT_LOGO` o `GRADE_LOGO_URL` para personalizar el logo del reporte (acepta URL http(s) o ruta local).

### Variantes npx / install desde npm

Si no quiere instalar dependencias locales, hay scripts `*:npx` y un paquete publicado `@zoomiit/openapi-anyenv-suite` que expone CLI equivalentes. Preferimos instalaciones locales con `pnpm` para reproducibilidad.

## Modelo de calificación

La calificación está controlada por `grade.config.json` en la raíz. Si falta, se usan valores por defecto integrados.

Estructura (resumen):

```json
{
  "penalties": { "spectral": { "error": 4, "warning": 1 }, "redocly": { "error": 5, "warning": 2 } },
  "bonuses": { "max": 20, "rules": { "info.title": 2 } },
  "grades": { "A": 90, "B": 80, "C": 65, "D": 50 }
}
```

Consulte `grade.config.json` para detalles (penalizaciones, bonificaciones y umbrales).

## Reglas de Spectral

El proyecto incluye reglas locales bajo `rules/` y `.spectral.yaml` extiende `spectral:oas`.

- Reglas principales: `rules/core.yaml`, `rules/business.yaml`, `rules/format.yaml`, `rules/pagination.yaml`, `rules/security.yaml`.
- Funciones personalizadas: `rules/functions/*.js`.

## Docker

Construya la imagen (BuildKit recomendado):

```bash
export DOCKER_BUILDKIT=1
docker build -t openapi-tools .
```

Hay imágenes preconstruidas en GHCR (etiquetadas por versión y `latest`). Monte `grade.config.json` si quiere una configuración personalizada en Docker.

## CI (GitHub Actions / Jenkins)

Se proporcionan workflows reutilizables en `.github/workflows/` y un ejemplo de pipeline de Jenkins en `docs/CI.md`.

Recomendaciones:

- Ejecutar tests primero y luego lint/grade en workflows (la repo ya tiene flujos ajustados para esto).
- Usar `pnpm` en runners y habilitar Corepack si es necesario en Jenkins agents.

## Testing

Las pruebas usan Jest. Para ejecutar localmente:

```bash
pnpm test
```

## Contribuir

- Leer `CONTRIBUTING.md` para guías de desarrollo y estilo.
- Ejecutar `pnpm test` y mantener la cobertura y lint limpios antes de abrir PRs.

## Notas finales

Este README consolida la información más relevante y evita títulos duplicados. Para más detalles (nodos avanzados, ejemplos y CI), consulte `docs/` y los archivos de `scripts/`.

  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run validate -- /spec/openapi.yaml

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
      - run: pnpm ci
      - run: pnpm run validate -- path/to/openapi.yaml
  - run: SCHEMA_LINT=1 pnpm run grade -- path/to/openapi.yaml
```

### Publish to npm (develop branch)

- Prerrequisitos
  - Agregar el secreto `NPM_TOKEN` al repositorio.
  - Asegurarse de que `package.json` tenga `private: false` y `publishConfig.access: public`.

- Publicación manual
  - Actions → "Publish to npm" → Run workflow (usa el commit actual en la rama).

- En etiqueta (recomendado)
  - Crear una etiqueta `vX.Y.Z`. El workflow publica el paquete con la misma versión.

## Repository Layout

- `scripts/` - Node scripts para bundle, validate, grade, report
- `rules/` — Paquetes de reglas de Spectral y funciones personalizadas
- `.spectral.yaml` — conjunto de reglas raíz que extiende paquetes locales
- `dist/` - carpeta de salida para paquetes y reportes

## Utilities

- `pnpm run doctor` - imprime versiones de Node/Spectral/Redocly

## Testing

Este proyecto usa Jest. Para ejecutar las pruebas:

```bash
pnpm test
```

The tests are also executed automatically before each commit using a pre-commit hook, and on each push and pull request using a GitHub Action.

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

## Quick Start

### Requirements

- Node.js 20.19.0+ or 22.12.0+
- pnpm

### Environment Flags

- `SCHEMA_LINT=1` Includes Redocly schema lint in validate/grade and factors it into the final score.
- `GRADE_SOFT=1` Forces a zero exit code even when errors are present (useful for non-blocking reports in CI).

### Install (local binaries)

```bash
pnpm install    # or: pnpm install --frozen-lockfile
```

### Validate (bundle + Spectral lint)

```bash
pnpm run validate -- path/to/openapi.yaml
# Windows PowerShell/CMD:
pnpm run validate -- "C:\path\to\openapi.yaml"
```

Optional schema check with Redocly:

```bash
SCHEMA_LINT=1 pnpm run validate -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; pnpm run validate -- "C:\path\to\openapi.yaml"
```

### Grade (A-E)

```bash
pnpm run grade -- path/to/openapi.yaml
# Enable schema lint within grading
SCHEMA_LINT=1 pnpm run grade -- path/to/openapi.yaml
```

Outputs

- Machine-readable: `dist/grade-report.json`
- Human-friendly: `dist/grade-report.html` (open in a browser)

The console prints the final score and letter grade.

### View Grade Report (HTML)

Serve the generated HTML report locally:

```bash
openapi-grade-report path/to/openapi.yaml --port 8080
# Then open http://127.0.0.1:8080/grade-report.html
```

Branding

- To show a custom logo on the report, set `REPORT_LOGO` (or `GRADE_LOGO_URL`).
- Accepts an `http(s)://...` URL or a local file path. Local paths are embedded as data URLs.
- Example:

```bash
REPORT_LOGO=./assets/logo.png openapi-grade-report path/to/openapi.yaml --port 8080
```

## Report Workflow (HTML + Docs + Swagger + Rebuild)

- One-shot generate and serve everything:

```bash
npm run report -- path/to/openapi.yaml --port 8080
# Serves dist/ with:
# - index.html (copy of grade-report.html)
# - docs.html (Redocly build-docs)
# - swagger.html + openapi-bundle.yaml
# In the header of index.html you’ll see links to Docs and Swagger.
```

- Rebuild from the UI: click “Rebuild” in the report header.
  - Regenerates report + docs + swagger
  - Shows a centered spinner
  - Disables Docs/Swagger links and AI controls during the process
  - Forces a reload without cache when done

- Generate only (no server), useful in CI:

```bash
npm run report -- path/to/openapi.yaml --generate-only
```

- Serve an existing `dist/` (no generation):

```bash
npm run report:serve
# serves dist/ on http://127.0.0.1:8080
```

### Try It (example spec included)

```bash
# Validate and grade the bundled example
npm run validate -- example/openapi.yaml
npm run grade -- example/openapi.yaml
```

### npx (no local install)

```bash
npm run validate:npx -- path/to/openapi.yaml
npm run grade:npx -- path/to/openapi.yaml
npm run bundle:npx -- path/to/openapi.yaml --out dist/bundled.yaml
```

### Install from npm (CLI)

Use the published package `@zoomiit/openapi-anyenv-suite` to run the tools without cloning this repo.

Global install provides convenient CLI commands:

```bash
npm i -g @zoomiit/openapi-anyenv-suite

# Validate
openapi-validate path/to/openapi.yaml

# Grade
SCHEMA_LINT=1 openapi-grade path/to/openapi.yaml
## PowerShell
# $env:SCHEMA_LINT=1; openapi-grade path/to/openapi.yaml

# Bundle
openapi-bundle path/to/openapi.yaml --out dist/bundled-openapi.yaml
```

Local install alternative:

```bash
npm i --save-dev @zoomiit/openapi-anyenv-suite

# Run any CLI via npx without global install
npx -p @zoomiit/openapi-anyenv-suite openapi-validate path/to/openapi.yaml
npx -p @zoomiit/openapi-anyenv-suite openapi-grade path/to/openapi.yaml
npx -p @zoomiit/openapi-anyenv-suite openapi-bundle path/to/openapi.yaml --out dist/bundled.yaml
```

Notes

- SCHEMA_LINT=1 includes Redocly's schema lint in validation/grading.
- CLI commands bundle internally before linting to resolve $ref across files.
- Programmatic API is not provided; the recommended interface is the CLI.

Notes:

- `validate:npx`/`bundle:npx` currently pin Redocly CLI 2.6.0.
- Prefer local installs for fully reproducible results.

### Makefile (Linux/WSL/Git Bash)

```bash
make validate path/to/openapi.yaml
SCHEMA_LINT=1 make validate path/to/openapi.yaml
make grade path/to/openapi.yaml
SCHEMA_LINT=1 make grade path/to/openapi.yaml
make bundle path/to/openapi.yaml OUT=dist/my-bundle.yaml

# npx variants
make validate-npx path/to/openapi.yaml
make grade-npx path/to/openapi.yaml
make bundle-npx path/to/openapi.yaml OUT=dist/my-bundle.yaml
```

## Grading Model (Editable)

Grading is configurable via the `grade.config.json` file. If this file does not exist, default values are used.

When running the `npm` and `make` commands locally, the `grade.config.json` file is automatically detected and used if it is present at the project root.

The `grade.config.json` file has the following structure:

```json
{
  "penalties": {
    "spectral": {
      "error": 4,
      "warning": 1,
      "maxError": 40,
      "maxWarning": 15
    },
    "redocly": {
      "error": 5,
      "warning": 2,
      "maxError": 25,
      "maxWarning": 10
    }
  },
  "bonuses": {
    "max": 20,
    "rules": {
      "info.title": 2,
      "info.version": 2,
      "servers": 1,
      "summaryRatio": {
        "threshold": 0.8,
        "points": 5
      },
      "descriptionRatio": {
        "threshold": 0.8,
        "points": 5
      },
      "4xxRatio": {
        "threshold": 0.7,
        "points": 5
      },
      "securitySchemes": 3
    }
  },
  "grades": {
    "A": 90,
    "B": 80,
    "C": 65,
    "D": 50
  }
}
```

### Penalties

The `penalties` section defines the points deducted for each Spectral and Redocly error or warning.

- `error`: Points deducted per error.
- `warning`: Points deducted per warning.
- `maxError`: Maximum points deducted for errors.
- `maxWarning`: Maximum points deducted for warnings.

### Bonuses

The `bonuses` section defines points awarded for meeting certain heuristics.

- `max`: Maximum bonus points awarded.
- `rules`: Rules for awarding points.

### Grades

The `grades` section defines score thresholds for each grade.

- `A`: Minimum score to receive an A.
- `B`: Minimum score to receive a B.
- `C`: Minimum score to receive a C.
- `D`: Minimum score to receive a D.

<!-- Environment flags section consolidated near Requirements to avoid duplication. -->
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

Public pulls require no auth. Prefer a version tag for clarity and reproducibility.

To use a custom grading configuration, mount your `grade.config.json` file to `/work/grade.config.json`.

```bash
# Pull (version tag)
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0
# Or use latest for a quick try
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:latest

# Validate (mount spec read-only; outputs to ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run validate -- /spec/openapi.yaml

# Validate with Redocly schema lint
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run validate -- /spec/openapi.yaml

# Grade (report written to host ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run grade -- /spec/openapi.yaml

# View Grade Report (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run report -- /spec/openapi.yaml --port 8080
```

Notes

- Images are tagged as `v<package.json version>` (recommended) and also as `latest`.
- The `v<version>` tag is created automatically on version bumps in package.json. Current: `v1.2.0`.

#### Quick test with the bundled example

From the repository root, run against `example/openapi.yaml`. This will also use the `grade.config.json` from the root of the repository.

```bash
# Validate
docker run --rm \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run validate -- /spec/openapi.yaml

# Grade (with schema lint)
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run grade -- /spec/openapi.yaml

```

### Run

To use a custom grading configuration, mount your `grade.config.json` file to `/work/grade.config.json`.

```bash
# Validate (mount spec read-only; outputs to ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run validate -- /spec/openapi.yaml

# With schema lint
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run validate -- /spec/openapi.yaml

# Grade
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run grade -- /spec/openapi.yaml

 

# View Grade Report (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run report -- /spec/openapi.yaml --port 8080
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

### Publish to npm (develop branch)

- Prerequisites
  - Add repository secret `NPM_TOKEN` (npm automation token).
  - Ensure `package.json` has `private: false` and `publishConfig.access: public` (already configured).

- Manual publish
  - Actions → "Publish to npm" → Run workflow (uses current commit on the branch).

- On tag (recommended)
  - Create a tag `vX.Y.Z` (done automatically on merge to master by auto‑version).
  - The workflow publishes the package to npm with the same version.

- Local dry‑run (optional)
  - `npm publish --dry-run` to inspect files included in the package.

## Repository Layout

- `scripts/` - Node scripts for bundle, validate, grade, report
- `rules/` — Spectral rule packs and custom functions
- `.spectral.yaml` — root ruleset extending local packs
- `dist/` - output folder for bundles and reports

## Utilities

- `npm run doctor` - prints Node/Spectral/Redocly versions

## Testing

This project uses [Jest](https://jestjs.io/) for unit testing. The tests are located in the `test/` directory.

To run the tests, use the following command:

```bash
npm test
```

The tests are also executed automatically before each commit using a pre-commit hook, and on each push and pull request using a GitHub Action.

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

# OpenAPI AnyEnv Suite

Este proyecto es una herramienta para validar, calificar y generar reportes de especificaciones OpenAPI.

![OAS logo](assets/logo-oas.png)

# OpenAPI Any-Env Suite + Quality Grade (Windows / Linux / WSL / Docker)

![Node.js](https://img.shields.io/badge/node-%E2%89%A520.19-blue) ![Spectral](https://img.shields.io/badge/Spectral-6.15.0-orange) ![Redocly](https://img.shields.io/badge/Redocly-2.7.0-red) ![Docker](https://img.shields.io/badge/runtime-Docker-blue)

[![Run Tests](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/test.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/test.yml)
[![Docker Publish](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml/badge.svg?branch=master)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml)
[![Docker Smoke Test](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-smoke-test.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-smoke-test.yml)
[![Release](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/release.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/release.yml)
[![Version](https://img.shields.io/github/v/tag/ramongranda/openapi-anyenv-suite?label=version&sort=semver)](https://github.com/ramongranda/openapi-anyenv-suite/releases)
[![npm](https://img.shields.io/npm/v/%40zoomiit%2Fopenapi-anyenv-suite?logo=npm&label=npm)](https://www.npmjs.com/package/@zoomiit/openapi-anyenv-suite)
[![npm downloads](https://img.shields.io/npm/dm/%40zoomiit%2Fopenapi-anyenv-suite?logo=npm)](https://www.npmjs.com/package/@zoomiit/openapi-anyenv-suite)
[![GHCR](https://img.shields.io/badge/GHCR-openapi--anyenv--suite-24292e?logo=github)](https://ghcr.io/ramongranda/openapi-anyenv-suite)
[![GHCR Tag](https://img.shields.io/github/v/tag/ramongranda/openapi-anyenv-suite?label=ghcr%20tag&sort=semver)](https://ghcr.io/ramongranda/openapi-anyenv-suite)
[![Platforms](https://img.shields.io/badge/platforms-linux%2Famd64%20%7C%20linux%2Farm64-2ea44f)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml)

All-in-one toolkit to bundle, lint, grade, and report OpenAPI specs. Ships with pinned tool versions and an opinionated Spectral ruleset, plus an A-E quality grade on top of your validation pipeline.

- Local tools: `@stoplight/spectral-cli` 6.15.0, `@redocly/cli` 2.7.0
- npx tools: pinned or latest depending on script (see Usage)

Note: Redocly CLI v2 is ESM-only. Use Node 20.19.0+ or 22.12.0+.

También disponible en español: docs/README.es.md

## Inicio Rápido

### Requisitos

- Node.js 20.19.0+ o 22.12.0+
- pnpm

### Variables de Entorno

- `SCHEMA_LINT=1` Incluye la verificación de esquema de Redocly en la validación/calificación y la factoriza en la puntuación final.
- `GRADE_SOFT=1` Fuerza un código de salida cero incluso cuando hay errores presentes (útil para informes no bloqueantes en CI).

### Instalación (binarios locales)

```bash
pnpm install    # o: pnpm install --frozen-lockfile
```

### Validar (empaquetar + lint de Spectral)

```bash
pnpm run validate -- path/to/openapi.yaml
# Windows PowerShell/CMD:
pnpm run validate -- "C:\path\to\openapi.yaml"
```

Comprobación de esquema opcional con Redocly:

```bash
SCHEMA_LINT=1 pnpm run validate -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; pnpm run validate -- "C:\path\to\openapi.yaml"
```

### Calificar (A-E)

```bash
pnpm run grade -- path/to/openapi.yaml
# Habilitar la verificación de esquema dentro de la calificación
SCHEMA_LINT=1 pnpm run grade -- path/to/openapi.yaml
```

Salidas

- Legible por máquina: `dist/grade-report.json`
- Amigable para humanos: `dist/grade-report.html` (abrir en un navegador)

La consola imprime la puntuación final y la calificación en letras.

### Ver Reporte de Calificación (HTML)

Sirve el reporte HTML generado localmente:

```bash
openapi-grade-report path/to/openapi.yaml --port 8080
# Luego abre http://127.0.0.1:8080/grade-report.html
```

Branding

- Para mostrar un logo personalizado en el reporte, establece `REPORT_LOGO` (o `GRADE_LOGO_URL`).
- Acepta una URL `http(s)://...` o una ruta de archivo local. Las rutas locales se incrustan como URLs de datos.
- Ejemplo:

```bash
REPORT_LOGO=./assets/logo.png openapi-grade-report path/to/openapi.yaml --port 8080
```

## Flujo de Trabajo del Reporte (HTML + Docs + Swagger + Rebuild)

- Generar y servir todo en uno:

```bash
npm run report -- path/to/openapi.yaml --port 8080
# Sirve dist/ con:
# - index.html (copia de grade-report.html)
# - docs.html (Redocly build-docs)
# - swagger.html + openapi-bundle.yaml
# En el encabezado de index.html verás enlaces a Docs y Swagger.
```

- Reconstruir desde la interfaz: haz clic en "Rebuild" en el encabezado del reporte.
  - Regenera reporte + docs + swagger
  - Muestra un spinner centrado
  - Desactiva los enlaces de Docs/Swagger y los controles de IA durante el proceso
  - Fuerza una recarga sin caché cuando termine

- Generar solo (sin servidor), útil en CI:

```bash
npm run report -- path/to/openapi.yaml --generate-only
```

- Servir un `dist/` existente (sin generación):

```bash
npm run report:serve
# sirve dist/ en http://127.0.0.1:8080
```

### Prueba (especificación de ejemplo incluida)

```bash
# Validar y calificar el ejemplo empaquetado
npm run validate -- example/openapi.yaml
npm run grade -- example/openapi.yaml
```

### npx (sin instalación local)

```bash
npm run validate:npx -- path/to/openapi.yaml
npm run grade:npx -- path/to/openapi.yaml
npm run bundle:npx -- path/to/openapi.yaml --out dist/bundled.yaml
```

### Instalación desde npm (CLI)

Usa el paquete publicado `@zoomiit/openapi-anyenv-suite` para ejecutar las herramientas sin clonar este repositorio.

La instalación global proporciona comandos CLI convenientes:

```bash
npm i -g @zoomiit/openapi-anyenv-suite

# Validar
openapi-validate path/to/openapi.yaml

# Calificar
SCHEMA_LINT=1 openapi-grade path/to/openapi.yaml
## PowerShell
# $env:SCHEMA_LINT=1; openapi-grade path/to/openapi.yaml

# Empaquetar
openapi-bundle path/to/openapi.yaml --out dist/bundled-openapi.yaml
```

Alternativa de instalación local:

```bash
npm i --save-dev @zoomiit/openapi-anyenv-suite

# Ejecutar cualquier CLI a través de npx sin instalación global
npx -p @zoomiit/openapi-anyenv-suite openapi-validate path/to/openapi.yaml
npx -p @zoomiit/openapi-anyenv-suite openapi-grade path/to/openapi.yaml
npx -p @zoomiit/openapi-anyenv-suite openapi-bundle path/to/openapi.yaml --out dist/bundled.yaml
```

Notas

- SCHEMA_LINT=1 incluye la verificación de esquema de Redocly en la validación/calificación.
- Los comandos CLI empaquetan internamente antes de la verificación para resolver $ref entre archivos.
- La API programática no está proporcionada; la interfaz recomendada es la CLI.

Notas:

- `validate:npx`/`bundle:npx` actualmente fijan Redocly CLI 2.6.0.
- Prefiere instalaciones locales para resultados completamente reproducibles.

### Makefile (Linux/WSL/Git Bash)

```bash
make validate path/to/openapi.yaml
SCHEMA_LINT=1 make validate path/to/openapi.yaml
make grade path/to/openapi.yaml
SCHEMA_LINT=1 make grade path/to/openapi.yaml
make bundle path/to/openapi.yaml OUT=dist/my-bundle.yaml

# variantes npx
make validate-npx path/to/openapi.yaml
make grade-npx path/to/openapi.yaml
make bundle-npx path/to/openapi.yaml OUT=dist/my-bundle.yaml
```

## Modelo de Calificación (Editable)

La calificación es configurable a través del archivo `grade.config.json`. Si este archivo no existe, se utilizan valores predeterminados.

Al ejecutar los comandos `npm` y `make` localmente, el archivo `grade.config.json` se detecta y utiliza automáticamente si está presente en la raíz del proyecto.

El archivo `grade.config.json` tiene la siguiente estructura:

```json
{
  "penalties": {
    "spectral": {
      "error": 4,
      "warning": 1,
      "maxError": 40,
      "maxWarning": 15
    },
    "redocly": {
      "error": 5,
      "warning": 2,
      "maxError": 25,
      "maxWarning": 10
    }
  },
  "bonuses": {
    "max": 20,
    "rules": {
      "info.title": 2,
      "info.version": 2,
      "servers": 1,
      "summaryRatio": {
        "threshold": 0.8,
        "points": 5
      },
      "descriptionRatio": {
        "threshold": 0.8,
        "points": 5
      },
      "4xxRatio": {
        "threshold": 0.7,
        "points": 5
      },
      "securitySchemes": 3
    }
  },
  "grades": {
    "A": 90,
    "B": 80,
    "C": 65,
    "D": 50
  }
}
```

### Penalizaciones

La sección `penalties` define los puntos deducidos por cada error o advertencia de Spectral y Redocly.

- `error`: Puntos deducidos por error.
- `warning`: Puntos deducidos por advertencia.
- `maxError`: Puntos máximos deducidos por errores.
- `maxWarning`: Puntos máximos deducidos por advertencias.

### Bonificaciones

La sección `bonuses` define los puntos otorgados por cumplir con ciertas heurísticas.

- `max`: Puntos máximos de bonificación otorgados.
- `rules`: Reglas para otorgar puntos.

### Calificaciones

La sección `grades` define los umbrales de puntuación para cada calificación.

- `A`: Puntuación mínima para recibir una A.
- `B`: Puntuación mínima para recibir una B.
- `C`: Puntuación mínima para recibir una C.
- `D`: Puntuación mínima para recibir una D.

<!-- Sección de flags de entorno consolidada cerca de los requisitos para evitar duplicación. -->
- `DEBUG_JSON=1` escribe las salidas del linter sin procesar en `dist/debug-*.txt` si falla el análisis.

## Conjunto de Reglas de Spectral

Conjunto de reglas principal: `.spectral.yaml`, extendiendo `spectral:oas` y paquetes de reglas locales:

- `rules/core.yaml` — rutas/nombres, documentación, etiquetas, esquemas
- `rules/business.yaml` — manejo de errores, enums, nombres, caché
- `rules/format.yaml` — tipos de contenido, reglas de solicitud/respuesta, formatos de datos
- `rules/pagination.yaml` — límites de matriz y consistencia de paginación
- `rules/security.yaml` — HTTPS, auth, respuestas de seguridad, rangos numéricos

Funciones personalizadas (CommonJS) están bajo `rules/functions/`:

- `validateDateTimeFormat.js` — hacer cumplir `date`/`date-time` para cadenas temporales
- `validatePropertyHasExample.js` — sugerir ejemplos en propiedades importantes
- `validateResponseHasExample.js` — requerir ejemplos para respuestas 2xx (a menos que `$ref`)
- `maxGteMin.js` — validar la coherencia del rango numérico

Puedes ajustar o desactivar reglas directamente en los archivos YAML o `.spectral.yaml`.

### Personalizar Reglas Rápidamente

- Cambiar la gravedad en `.spectral.yaml` (anula de los paquetes extendidos):

  ```yaml
  rules:
    operation-description: error   # era warn
    server-https: off              # desactivar
  ```

- Agregar una función personalizada:
  1) Coloca `rules/functions/myRule.js` y exporta una función `(input, context) => issues|undefined`.
  2) Referénciala en `rules/*.yaml` bajo `functions:` y úsala en `rules:`.
  3) Asegúrate de que `.spectral.yaml` `functionsDir` apunte a `./rules/functions`.

## Docker (BuildKit / buildx)

### Recomendado: Construir con BuildKit

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

### Usando buildx

```bash
docker buildx create --name devbuilder --use
docker buildx inspect --bootstrap
docker buildx build -t openapi-tools . --load   # usar --push para publicar
```

### Imagen preconstruida (GHCR)

Las extracciones públicas no requieren autenticación. Prefiere una etiqueta de versión para mayor claridad y reproducibilidad.

Para usar una configuración de calificación personalizada, monta tu archivo `grade.config.json` en `/work/grade.config.json`.

```bash
# Extraer (etiqueta de versión)
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0
# O usa latest para una prueba rápida
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:latest

# Validar (montar spec como solo lectura; salidas a ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run validate -- /spec/openapi.yaml

# Validar con la verificación de esquema de Redocly
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run validate -- /spec/openapi.yaml

# Calificar (reporte escrito en el host ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run grade -- /spec/openapi.yaml

# Ver Reporte de Calificación (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run report -- /spec/openapi.yaml --port 8080
```

Notas

- Las imágenes están etiquetadas como `v<package.json version>` (recomendado) y también como `latest`.
- La etiqueta `v<version>` se crea automáticamente en los aumentos de versión en package.json. Actual: `v1.2.0`.

#### Prueba rápida con el ejemplo empaquetado

Desde la raíz del repositorio, ejecuta contra `example/openapi.yaml`. Esto también utilizará el `grade.config.json` desde la raíz del repositorio.

```bash
# Validar
docker run --rm \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run validate -- /spec/openapi.yaml

# Calificar (con verificación de esquema)
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.12.0 \
  npm run grade -- /spec/openapi.yaml

```

### Ejecutar

Para usar una configuración de calificación personalizada, monta tu archivo `grade.config.json` en `/work/grade.config.json`.

```bash
# Validar (montar spec como solo lectura; salidas a ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run validate -- /spec/openapi.yaml

# Con verificación de esquema
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run validate -- /spec/openapi.yaml

# Calificar
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run grade -- /spec/openapi.yaml

 

# Ver Reporte de Calificación (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  npm run report -- /spec/openapi.yaml --port 8080
```

## Uso en CI (ejemplo)

Ejemplo de GitHub Actions para validación y calificación:

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

### Publicar en npm (rama de desarrollo)

- Prerrequisitos
  - Agregar el secreto del repositorio `NPM_TOKEN` (token de automatización de npm).
  - Asegurarse de que `package.json` tenga `private: false` y `publishConfig.access: public` (ya configurado).

- Publicación manual
  - Actions → "Publish to npm" → Run workflow (usa el commit actual en la rama).

- En etiqueta (recomendado)
  - Crear una etiqueta `vX.Y.Z` (hecho automáticamente en la fusión a master por auto‑version).
  - El flujo de trabajo publica el paquete en npm con la misma versión.

- Prueba en seco local (opcional)
  - `npm publish --dry-run` para inspeccionar los archivos incluidos en el paquete.

## Estructura del Repositorio

- `scripts/` - Scripts de Node para empaquetar, validar, calificar, reportar
- `rules/` — Paquetes de reglas de Spectral y funciones personalizadas
- `.spectral.yaml` — conjunto de reglas raíz que extiende paquetes locales
- `dist/` - carpeta de salida para paquetes y reportes

## Utilidades

- `npm run doctor` - imprime versiones de Node/Spectral/Redocly

## Pruebas

Este proyecto usa [Jest](https://jestjs.io/) para pruebas unitarias. Las pruebas están ubicadas en el directorio `test/`.

Para ejecutar las pruebas, usa el siguiente comando:

```bash
npm test
```

Las pruebas también se ejecutan automáticamente antes de cada commit usando un gancho pre-commit, y en cada push y pull request usando una Acción de GitHub.

## Consejos y Solución de Problemas

- Siempre pasa la ruta de la especificación después de `--` al usar scripts de npm.
- En Windows, si `node_modules` está bloqueado: cierra observadores/editores, ejecuta `npx rimraf node_modules`, y luego reinstala.
- Asegúrate de que la versión de Node satisfaga el requisito de Redocly v2 (20.19.0+ o 22.12.0+).

## Flujos de Trabajo de CI Reutilizables

- Validar: usa `ramongranda/openapi-anyenv-suite/.github/workflows/openapi-validate.yml@master`
- Calificar: usa `ramongranda/openapi-anyenv-suite/.github/workflows/openapi-grade.yml@master`
- Docs: usa `ramongranda/openapi-anyenv-suite/.github/workflows/openapi-docs.yml@master`

Consulta `docs/CI.md` para el uso completo, entradas y el ejemplo de pipeline de Jenkins.

## Proceso de Liberación

- Ramificación: develop es la rama de integración; master mantiene las versiones.
- El trabajo de características se dirige a ramas de develop; fusión a develop a través de PR.
- Para liberar en master, abre un PR en master. La etiqueta de liberación se aplica automáticamente según los Commits Convencionales (título/commits). Si no se encuentra una señal clara, el valor predeterminado es `release:minor`.
  - `release:major` cuando se detecta un cambio de ruptura (`!`/`BREAKING CHANGE`)
  - `release:minor` para características o como predeterminado
  - `release:patch` puede usarse explícitamente si deseas un aumento de parche
- Al fusionar, el flujo de trabajo de Auto Version:
  - Ejecuta `npm version <type>` en master, confirma y etiqueta `v<version>`
  - Activa Release, publicación de Docker en GHCR (etiquetas: `v<version>`, `latest`), y la prueba de humo de Docker.
- La verificación de aumento de versión en PR se omite cuando hay una etiqueta de liberación presente.

# OpenAPI AnyEnv Suite

Este proyecto es una herramienta para validar, calificar y generar reportes de especificaciones OpenAPI.

![OAS logo](assets/logo-oas.png)

# OpenAPI Any-Env Suite + Quality Grade (Windows / Linux / WSL / Docker)

![Node.js](https://img.shields.io/badge/node-%E2%89%A520.19-blue) ![Spectral](https://img.shields.io/badge/Spectral-6.15.0-orange) ![Redocly](https://img.shields.io/badge/Redocly-2.7.0-red) ![Docker](https://img.shields.io/badge/runtime-Docker-blue)

[![Run Tests](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/test.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/test.yml)
[![Docker Publish](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml/badge.svg?branch=master)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml)
[![Docker Smoke Test](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-smoke-test.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-smoke-test.yml)
[![Release](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/release.yml/badge.svg)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/release.yml)
[![Version](https://img.shields.io/github/v/tag/ramongranda/openapi-anyenv-suite?label=version&sort=semver)](https://github.com/ramongranda/openapi-anyenv-suite/releases)
[![npm](https://img.shields.io/npm/v/%40zoomiit%2Fopenapi-anyenv-suite?logo=npm&label=npm)](https://www.npmjs.com/package/@zoomiit/openapi-anyenv-suite)
[![npm downloads](https://img.shields.io/npm/dm/%40zoomiit%2Fopenapi-anyenv-suite?logo=npm)](https://www.npmjs.com/package/@zoomiit/openapi-anyenv-suite)
[![GHCR](https://img.shields.io/badge/GHCR-openapi--anyenv--suite-24292e?logo=github)](https://ghcr.io/ramongranda/openapi-anyenv-suite)
[![GHCR Tag](https://img.shields.io/github/v/tag/ramongranda/openapi-anyenv-suite?label=ghcr%20tag&sort=semver)](https://ghcr.io/ramongranda/openapi-anyenv-suite)
[![Platforms](https://img.shields.io/badge/platforms-linux%2Famd64%20%7C%20linux%2Farm64-2ea44f)](https://github.com/ramongranda/openapi-anyenv-suite/actions/workflows/docker-publish.yml)

All-in-one toolkit to bundle, lint, grade, and report OpenAPI specs. Ships with pinned tool versions and an opinionated Spectral ruleset, plus an A-E quality grade on top of your validation pipeline.

- Local tools: `@stoplight/spectral-cli` 6.15.0, `@redocly/cli` 2.7.0
- npx tools: pinned or latest depending on script (see Usage)

Note: Redocly CLI v2 is ESM-only. Use Node 20.19.0+ or 22.12.0+.

También disponible en español: docs/README.es.md

## Inicio Rápido

### Requisitos

- Node.js 20.19.0+ o 22.12.0+
- pnpm

### Variables de Entorno

- `SCHEMA_LINT=1` Incluye la verificación de esquema de Redocly en la validación/calificación y la factoriza en la puntuación final.
- `GRADE_SOFT=1` Fuerza un código de salida cero incluso cuando hay errores presentes (útil para informes no bloqueantes en CI).

### Instalación (binarios locales)

```bash
pnpm install    # o: pnpm install --frozen-lockfile
```

### Validar (empaquetar + lint de Spectral)

```bash
pnpm run validate -- path/to/openapi.yaml
# Windows PowerShell/CMD:
pnpm run validate -- "C:\path\to\openapi.yaml"
```

Comprobación de esquema opcional con Redocly:

```bash
SCHEMA_LINT=1 pnpm run validate -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; pnpm run validate -- "C:\path\to\openapi.yaml"
```

### Calificar (A-E)

```bash
pnpm run grade -- path/to/openapi
