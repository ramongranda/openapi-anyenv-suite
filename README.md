# OpenAPI AnyEnv Suite

OpenAPI AnyEnv Suite es una herramienta para validar, calificar y generar reportes HTML/JSON para especificaciones OpenAPI.

Estado y propósito

- Entrypoint canónico: `pnpm run check` (valida y califica).
- Generación/servicio del reporte: `pnpm run report`.

Requisitos

- Node.js: para desarrollo local y compatibilidad con Redocly v2 se soportan Node.js 20.19.0+ o 22.12.0+;
  sin embargo, la herramienta de publicación automática `semantic-release` (v25) requiere Node >= 24.10.0.
  Recomendamos que los mantenedores y runners de CI usen Node >= 24.10.0 para que los workflows de release
  y publicación funcionen correctamente. Para contribuyentes, usar `nvm` o `corepack` para alternar entre
  versiones locales según sea necesario.

Nota sobre el lint de esquema

- La verificación de esquema con Redocly es opcional (activable mediante `SCHEMA_LINT=1`). El flujo incluye fallbacks locales para bundling y genera un bundle mínimo cuando Redocly no está disponible, de modo que `pnpm run check` funciona sin depender de una herramienta externa no publicada.

Instalación (local)

```bash
pnpm install --frozen-lockfile
```

Uso

```bash
# Validar + calificar (y opcionalmente generar docs)
pnpm run check -- path/to/openapi.yaml [--no-bundle] [--soft] [--docs]

# Generar y servir el reporte HTML
pnpm run report -- path/to/openapi.yaml --port 8080
```

Notas

- Los wrappers NPX y variantes duplicadas han sido eliminados; la documentación completa y ejemplos de CI/Docker están en `docs/`.

Archivos clave

- `scripts/grade.mjs` — flujo unificado (bundle tolerante, Spectral, Redocly opcional, scoring, reportes).
- `scripts/grade-report.mjs` — generación/servidor del reporte HTML.
- `scripts/validate-core.mjs` — implementación canónica de validación.

Tests

```bash
pnpm test
```

# OpenAPI AnyEnv Suite

OpenAPI AnyEnv Suite is a toolkit to validate, grade, and generate HTML/JSON reports for OpenAPI specifications.

Canonical entrypoints

- `pnpm run check` — validate and grade a spec
- `pnpm run report` — generate and serve the HTML report

Requirements

- Node.js: Development and Redocly v2 require Node 20.19.0+ or 22.12.0+. The release automation (semantic-release v25) requires Node >= 24.10.0. Maintain CI runners with Node >= 24.10.0 for consistent release workflows.
- pnpm (Corepack supported)

Schema linting

- Redocly schema lint is optional and enabled with `SCHEMA_LINT=1`. When Redocly is not available the tool falls back to an internal bundler so `pnpm run check` works without external dependencies.

Quick install (local)

```bash
pnpm install --frozen-lockfile
```

Usage

```bash
# Validate + grade (and optionally generate docs)
pnpm run check -- path/to/openapi.yaml [--no-bundle] [--soft] [--docs]

# Generate and serve the HTML report
pnpm run report -- path/to/openapi.yaml --port 8080
```

Outputs

- `dist/grade-report.json` — machine-readable grading output
- `dist/grade-report.html` — human-friendly HTML report

Branding

Set `REPORT_LOGO` or `GRADE_LOGO_URL` to show a custom logo in the report (supports http(s) URLs or local paths).

Grading model

The grading model is driven by `grade.config.json` in the repository root. If missing, built-in defaults apply. See `grade.config.json` for penalties, bonuses and grade thresholds.

Spectral rules

Local rule packs are under `rules/`. The root `.spectral.yaml` extends `spectral:oas` and the included packs.

Docker

Build the image (BuildKit recommended):

```bash
export DOCKER_BUILDKIT=1
docker build -t openapi-tools .
```

Prebuilt images are available on GHCR (tagged by version and `latest`). To customize grading in Docker, mount `grade.config.json`.

CI (GitHub Actions / Jenkins)

Reusable workflows live in `.github/workflows/`. See `docs/` for examples and CI integration notes.

Testing

This project uses Jest. Run tests locally with:

```bash
pnpm test
```

Contributing

- See `CONTRIBUTING.md` for development guidelines and style rules.
- Run `pnpm test` and keep lint checks passing before opening PRs.

Quick links

- Docs and examples: `docs/`
- Example spec: `example/openapi.yaml`

For CI/Docker/Jenkins examples and advanced usage, consult the `docs/` folder.
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# Validate with Redocly schema lint
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# Grade (report written to host ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# View Grade Report (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run report -- /spec/openapi.yaml --port 8080
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
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# Grade (with schema lint)
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  SCHEMA_LINT=1 pnpm run check -- /spec/openapi.yaml

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
  pnpm run check -- /spec/openapi.yaml

# With schema lint
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  pnpm run check -- /spec/openapi.yaml

# Grade
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  pnpm run check -- /spec/openapi.yaml

 

# View Grade Report (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  pnpm run report -- /spec/openapi.yaml --port 8080
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
    - run: pnpm ci
    - run: pnpm run check -- path/to/openapi.yaml
    - run: SCHEMA_LINT=1 pnpm run check -- path/to/openapi.yaml
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

- Local tools: `@stoplight/spectral-cli` 6.15.0 and `@redocly/cli` 2.7.0 (installed by default in this repository).
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
pnpm run check -- path/to/openapi.yaml
# Windows PowerShell/CMD:
pnpm run check -- "C:\path\to\openapi.yaml"
```

Comprobación de esquema opcional con Redocly:

```bash
SCHEMA_LINT=1 pnpm run check -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; pnpm run check -- "C:\path\to\openapi.yaml"
```

### Calificar (A-E)

```bash
pnpm run check -- path/to/openapi.yaml
# Habilitar la verificación de esquema dentro de la calificación
SCHEMA_LINT=1 pnpm run check -- path/to/openapi.yaml
```

Salidas

- Legible por máquina: `dist/grade-report.json`
- Amigable para humanos: `dist/grade-report.html` (abrir en un navegador)

La consola imprime la puntuación final y la calificación en letras.

### Ver Reporte de Calificación (HTML)

Sirve el reporte HTML generado localmente:

```bash
pnpm run report -- path/to/openapi.yaml --port 8080
# Luego abre http://127.0.0.1:8080/grade-report.html
```

Branding

- Para mostrar un logo personalizado en el reporte, establece `REPORT_LOGO` (o `GRADE_LOGO_URL`).
- Acepta una URL `http(s)://...` o una ruta de archivo local. Las rutas locales se incrustan como URLs de datos.
- Ejemplo:

```bash
REPORT_LOGO=./assets/logo.png pnpm run report -- path/to/openapi.yaml --port 8080
```

## Flujo de Trabajo del Reporte (HTML + Docs + Swagger + Rebuild)

- Generar y servir todo en uno:

```bash
pnpm run report -- path/to/openapi.yaml --port 8080
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
pnpm run report -- path/to/openapi.yaml --generate-only
```

- Servir un `dist/` existente (sin generación):

```bash
pnpm run report:serve
# sirve dist/ en http://127.0.0.1:8080
```

### Prueba (especificación de ejemplo incluida)

```bash
# Validar y calificar el ejemplo empaquetado
pnpm run check -- example/openapi.yaml
```

### npx (sin instalación local)

```bash
# npx wrappers removed from docs; use pnpm or install the CLI globally for quick runs.
```

### Instalación desde npm (CLI)

Usa el paquete publicado `@zoomiit/openapi-anyenv-suite` para ejecutar las herramientas sin clonar este repositorio.

La instalación global proporciona comandos CLI convenientes:

```bash
npm i -g @zoomiit/openapi-anyenv-suite

# Validar (recomendado: usar el script local `check`)
pnpm run check -- path/to/openapi.yaml

# Calificar (incluye la verificación de esquema cuando se exporta)
SCHEMA_LINT=1 pnpm run check -- path/to/openapi.yaml
## PowerShell
# $env:SCHEMA_LINT=1; pnpm run check -- "C:\path\to\openapi.yaml"

# Empaquetar (si necesita generar un bundle de forma aislada, use pnpm dlx)
pnpm dlx @zoomiit/openapi-anyenv-suite openapi-bundle path/to/openapi.yaml --out dist/bundled-openapi.yaml
```

Alternativa de instalación local:

```bash
pnpm add -D @zoomiit/openapi-anyenv-suite

# Ejecuta los binarios con pnpm dlx si lo necesitas
pnpm dlx @zoomiit/openapi-anyenv-suite pnpm run check -- path/to/openapi.yaml
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
make check path/to/openapi.yaml
SCHEMA_LINT=1 make check path/to/openapi.yaml
make report path/to/openapi.yaml

# variantes npx removed
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
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0
# O usa latest para una prueba rápida
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:latest

# Validar (montar spec como solo lectura; salidas a ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# Validar con la verificación de esquema de Redocly
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# Calificar (reporte escrito en el host ./dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# Ver Reporte de Calificación (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run report -- /spec/openapi.yaml --port 8080
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
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

# Calificar (con verificación de esquema)
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml

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
  pnpm run check -- /spec/openapi.yaml

# Con verificación de esquema
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  pnpm run check -- /spec/openapi.yaml

# Calificar
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  pnpm run check -- /spec/openapi.yaml

 

# Ver Reporte de Calificación (HTML)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  openapi-tools \
  pnpm run report -- /spec/openapi.yaml --port 8080
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
    - run: pnpm ci
    - run: pnpm run check -- path/to/openapi.yaml
    - run: SCHEMA_LINT=1 pnpm run check -- path/to/openapi.yaml
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

- Local tools: `@stoplight/spectral-cli` 6.15.0. Redocly (optional) may be used when available.
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
pnpm run check -- path/to/openapi.yaml
# Windows PowerShell/CMD:
pnpm run check -- "C:\path\to\openapi.yaml"
```

Comprobación de esquema opcional con Redocly:

```bash
SCHEMA_LINT=1 pnpm run check -- path/to/openapi.yaml
# PowerShell
$env:SCHEMA_LINT=1; pnpm run check -- "C:\path\to\openapi.yaml"
```

### Calificar (A-E)

```bash
pnpm run check -- path/to/openapi
