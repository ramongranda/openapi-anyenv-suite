# OpenAPI AnyEnv Suite

OpenAPI AnyEnv Suite is a toolkit to validate, grade, and generate HTML/JSON reports for OpenAPI specifications.

Overview

- Canonical entrypoints:
  - `pnpm run check` — validate and grade a spec
  - `pnpm run report:static` — generate the static HTML report (writes dist/index.html)

Requirements

- Node.js: Development tools and Redocly v2 require Node 20.19.0+ or 22.12.0+. Release automation (semantic-release v25) requires Node >= 24.10.0. We recommend CI runners use Node >= 24.10.0 for release workflows.
- pnpm (Corepack supported)

Schema linting

- Redocly schema lint is optional and enabled with `SCHEMA_LINT=1`. When Redocly is not available the tool falls back to the built-in bundler so `pnpm run check` works without external services.

Quick install (local)

```bash
pnpm install --frozen-lockfile
```

Usage

Direct CLI (no install)

```bash
# Using pnpm dlx
pnpm dlx @zoomiit/openapi-anyenv-suite openapi-grade -- path/to/openapi.yaml [--no-bundle] [--soft] [--docs]

# Using npx (npm >= 7)
npx -y @zoomiit/openapi-anyenv-suite openapi-grade -- path/to/openapi.yaml

# Windows PowerShell example
pnpm dlx @zoomiit/openapi-anyenv-suite openapi-grade -- "C:\\path\\to\\openapi.yaml"
```

Render docs from an existing bundle (npx/pnpm)

```bash
# Using npx (avoids multiple-bin prompt)
npx -y @redocly/cli@2.8.0 redocly build-docs dist/bundled.json --output dist/docs.html

# Using pnpm dlx (must specify the binary name)
pnpm --package=@redocly/cli@2.8.0 dlx redocly build-docs dist/bundled.json --output dist/docs.html

# Fallback (classic redoc-cli)
npx -y redoc-cli bundle dist/bundled.json -o dist/docs.html
```

Notes (npx/pnpm)

- With pnpm dlx, packages exposing multiple binaries (like @redocly/cli) require specifying the binary
  name (use `redocly` or `openapi`).
- Redocly CLI engines: Node >= 22.12.0 or >= 20.19.0 < 21. Ensure your Node version satisfies this
  requirement to avoid engine warnings.

What gets generated

- `openapi-grade` renders `dist/index.html` using the bundled HTML template (no extra setup), even when run via `dlx`/`npx`.
- When `--docs` is provided, it tries to build `dist/docs.html` with Redocly; if unavailable, it creates a minimal `docs.html` and `swagger.html` that consume `dist/bundled.json` so links always work.
- `dist/grade-report.json` is always written; `dist/grade-report.html` is also written as a legacy copy of `index.html` for compatibility.
```

```bash
# Validate + grade (and optionally generate docs)
pnpm run check -- path/to/openapi.yaml [--no-bundle] [--soft] [--docs]

# Generate the static HTML report
pnpm run report:static -- path/to/openapi.yaml
# Preview the generated site
pnpm run serve:dist  # opens a preview of dist/ on http://127.0.0.1:5173/index.html
```

Outputs

- `dist/grade-report.json` - machine-readable grading result
- `dist/index.html` - human-friendly HTML report (templated)
- `dist/docs.html` - API docs (Redocly when available, otherwise a lightweight fallback that consumes `bundled.json`)
- `dist/swagger.html` - Swagger UI fallback (consumes `bundled.json`)

Docs generation behavior

- Pass `--docs` to request docs pages. If Redocly is available, it builds `docs.html`.
- When bundling fails, the tool skips docs/swagger by default to avoid misleading outputs.
- Force fallback docs even on bundle errors with:
  - Flag: `--docs-force`
  - Env: `DOCS_FORCE=1`
  This creates lightweight `docs.html` and `swagger.html` that render whatever is in `dist/bundled.json` (including the minimal stub when applicable).

Branding

Set `REPORT_LOGO` or `GRADE_LOGO_URL` to show a custom logo in the report (supports http(s) URLs or local paths). Local file paths are embedded as data-URLs.

Grading model

The grading model is driven by `grade.config.json` in the repository root. If this file is missing, the packaged `grade.config.json` bundled with the tool is used automatically. If that is not available, built‑in defaults apply. See that file for penalties, bonuses and grade thresholds.

Spectral rules

Local rule packs live under `rules/`. The root `.spectral.yaml` extends `spectral:oas` and the included packs.

Docker

Build the image (BuildKit recommended):

```bash
export DOCKER_BUILDKIT=1
docker build -t openapi-tools .
```

On Windows PowerShell:

```powershell
$env:DOCKER_BUILDKIT=1
docker build -t openapi-tools .
```

Prebuilt images are published to GHCR and are tagged by version and `latest`. To customize grading in Docker, mount your `grade.config.json` into `/work/grade.config.json`.

Example: run validation inside the official image

```bash
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  -v "$PWD/grade.config.json:/work/grade.config.json:ro" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.13.0 \
  pnpm run check -- /spec/openapi.yaml
```

CI (GitHub Actions / Jenkins)

Reusable workflows live in `.github/workflows/`. See `docs/` for examples and integration notes.

Testing

This project uses Jest. Run tests locally with:

```bash
pnpm test
```

Contributing

See `CONTRIBUTING.md` for development guidelines and style rules. Run `pnpm test` and keep lint checks passing before opening PRs.

Repository layout

- `scripts/` — Node scripts for bundling, validation, grading, and reporting
- `rules/` — Spectral rule packs and custom functions
- `.spectral.yaml` — root ruleset
- `dist/` — output folder for bundles and reports

Utilities

- `npm run doctor` — prints Node/Spectral/Redocly versions

Docker: buildx / multi-arch

```bash
docker buildx create --name devbuilder --use
docker buildx inspect --bootstrap
docker buildx build -t openapi-tools . --load   # use --push to publish
```

Image tags

Images are tagged as `v<package.json version>` and `latest`. Prefer versioned tags for reproducibility.

Release process

- Branching: `develop` is the integration branch; `main` is the release branch.
- Use `release/*` branches for pre-releases. Semantic-Release is the canonical publisher and runs on merges to `main`.

Prerequisites for publishing

- Add `NPM_TOKEN` to repository secrets for npm publish. In some orgs you may also need a PAT for GHCR if `GITHUB_TOKEN` cannot write packages.

Local dry-run

```bash
npm publish --dry-run
```

CI example (GitHub Actions)

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

Useful notes

- When using npm scripts that accept a spec path, pass the path after `--` to forward arguments correctly.
- On Windows, if `node_modules` is locked: close editors/watchers, run `npx rimraf node_modules`, and reinstall.

Further reading

See `docs/` for CI examples, Docker usage, and the Jenkins pipeline sample.

Quick links

- Example spec: `example/openapi.yaml`
- Docs and examples: `docs/`

If you prefer Spanish documentation, see `docs/README.es.md`.

*** End Patch
pnpm dlx @zoomiit/openapi-anyenv-suite openapi-bundle path/to/openapi.yaml --out dist/bundled-openapi.yaml
```

Alternativa de instalación local:

```bash
pnpm add -D @zoomiit/openapi-anyenv-suite

# Ejecuta los binarios con pnpm dlx si lo necesitas
pnpm dlx @zoomiit/openapi-anyenv-suite openapi-grade -- path/to/openapi.yaml
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
  pnpm run report:static -- /spec/openapi.yaml
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
  pnpm run report:static -- /spec/openapi.yaml
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

![Node.js](https://img.shields.io/badge/node-%E2%89%A520.19-blue) ![Spectral](https://img.shields.io/badge/Spectral-6.15.0-orange) ![Redocly](https://img.shields.io/badge/Redocly-2.8.0-red) ![Docker](https://img.shields.io/badge/runtime-Docker-blue)

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
