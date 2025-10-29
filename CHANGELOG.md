# [3.9.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.8.4...v3.9.0) (2025-10-29)


### Features

* **bundle:** tolerante con  inválidos — reemplaza refs no resueltas por placeholders para permitir generar bundle/docs ([02601ff](https://github.com/ramongranda/openapi-anyenv-suite/commit/02601ff27f9383c7bd777057bb2dc1db8d51536c))


### Reverts

* **spectral:** quitar --fail-severity=off; volver a severidad por defecto (validate: error) para que los errores se muestren correctamente ([c0377c5](https://github.com/ramongranda/openapi-anyenv-suite/commit/c0377c5f65220e2376453ca41b3bd7bf3f5b040b))

## [3.8.4](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.8.3...v3.8.4) (2025-10-29)

## [3.8.3](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.8.2...v3.8.3) (2025-10-29)

## [3.8.2](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.8.1...v3.8.2) (2025-10-29)

## [3.8.1](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.8.0...v3.8.1) (2025-10-29)

# [3.8.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.7.0...v3.8.0) (2025-10-29)


### Features

* **report:** paginación en tablas de issues (Spectral/Redocly) con controles Prev/Next y tamaño de página configurable ([844d54d](https://github.com/ramongranda/openapi-anyenv-suite/commit/844d54d659dfefc73ddfdbf3d3cc8fe52af7ed67))

# [3.7.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.6.0...v3.7.0) (2025-10-29)


### Features

* **report:** eliminar UI de rebuild y referencias; añadir badge de docs (ya inyectado por grade-report.mjs) ([95f214d](https://github.com/ramongranda/openapi-anyenv-suite/commit/95f214d896f623ee187332e6a130ec32b6116500))

# [3.6.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.5.0...v3.6.0) (2025-10-29)


### Features

* **docs:** añadir --docs-force / DOCS_FORCE=1 para forzar docs y swagger incluso con errores de bundle; documentar comportamiento en README ([954bd99](https://github.com/ramongranda/openapi-anyenv-suite/commit/954bd9946b15e87946b682d949b80661ebe38649))

# [3.5.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.4.0...v3.5.0) (2025-10-29)


### Features

* **docs:** no generar docs/swagger cuando el bundle falla (saltamos con aviso); mantener grade y report JSON ([7cc5a9f](https://github.com/ramongranda/openapi-anyenv-suite/commit/7cc5a9fe3e8fc85b37ff43c5ff43acb1be44f4c7))

# [3.4.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.3.1...v3.4.0) (2025-10-29)


### Features

* **report:** render index.html desde plantilla también en openapi-grade; generar fallbacks docs.html y swagger.html si Redocly no está disponible ([457262e](https://github.com/ramongranda/openapi-anyenv-suite/commit/457262e840241c63b81f78402c2a88536bf65cb3))

## [3.3.1](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.3.0...v3.3.1) (2025-10-29)

# [3.3.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.2.0...v3.3.0) (2025-10-29)


### Features

* **report:** openapi-grade genera index.html con plantilla y crea fallback docs.html/swagger.html para uso via dlx; report:static mantiene comportamiento ([6a04c2b](https://github.com/ramongranda/openapi-anyenv-suite/commit/6a04c2b47493cf5c180b9647c421e3f9d8c400cd))

# [3.2.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.1.0...v3.2.0) (2025-10-29)


### Features

* **grade:** usar scripts y ruleset internos del paquete y fallback a grade.config.json empaquetado\n\n- Fallback de bundle usa scripts/bundle.mjs del paquete (npx/dlx-friendly)\n- Spectral siempre usa .spectral.yaml del paquete por defecto\n- loadConfig ahora prioriza CWD y cae a grade.config.json del paquete\n- Ajuste Windows: evitar spawn EINVAL en shims usando shell en run() ([b5bd69b](https://github.com/ramongranda/openapi-anyenv-suite/commit/b5bd69bab74e470245e92c20553f9acd75af756f))

# [3.1.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.0.1...v3.1.0) (2025-10-26)


### Features

* regenerate ([69ec534](https://github.com/ramongranda/openapi-anyenv-suite/commit/69ec534d28d19bd812e79ca3c8e6df341f8836c2))

## [3.0.1](https://github.com/ramongranda/openapi-anyenv-suite/compare/v3.0.0...v3.0.1) (2025-10-24)

# [3.0.0](https://github.com/ramongranda/openapi-anyenv-suite/compare/v2.13.1...v3.0.0) (2025-10-24)


### Bug Fixes

* run child processes without shell to handle paths with spaces on Windows and avoid DEP0190 ([726c22d](https://github.com/ramongranda/openapi-anyenv-suite/commit/726c22d9044f6630b438d31c6ed56c4ea3ba6ee6))


### Features

* semantic ([ef1b139](https://github.com/ramongranda/openapi-anyenv-suite/commit/ef1b13928d5e17a89d6feaa1d0476eb9a752a2fc))

## [2.13.1](https://github.com/ramongranda/openapi-anyenv-suite/compare/v2.13.0...v2.13.1) (2025-10-24)

### Bug Fixes

* **bundle/grade:** robust arg parsing for quoted '--' and single-token cases ([19ec8ec](https://github.com/ramongranda/openapi-anyenv-suite/commit/19ec8ec953978a6f1ef1fe1e522333fb94054bf2))
* **bundle/validate:** ensure bundle output uses extension (.json by default) ([7cfb70d](https://github.com/ramongranda/openapi-anyenv-suite/commit/7cfb70d545b2dfd76335e3020b8c2bb04e8d172a))
* **bundle:** robust arg parsing for bundle.mjs (ignore --, prefer file-like args) ([3db3dc8](https://github.com/ramongranda/openapi-anyenv-suite/commit/3db3dc847cf2bf1a64d10764bfa8de494bc697ea))
* **validate:** normalize CLI args to ignore '--' and accept quoted single-token inputs ([4178c17](https://github.com/ramongranda/openapi-anyenv-suite/commit/4178c17d917ed53d0c92ef606de3f3d7e4cab106))

# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog, and this project adheres to semantic versioning.

## [Unreleased]

### Added

- Grading now generates a human-friendly HTML report alongside JSON:
  * `dist/grade-report.html` includes summary (score, letter) and tables of Spectral findings and (optionally) Redocly findings when schema lint is enabled.
  * `dist/grade-report.json` remains for automation.
    * CI archives both `dist/grade-report.json` and `dist/grade-report.html`.

### Enhanced

- HTML report UX:
  * AI Tools: select issues (errors/warnings), generate/copy prompt; prompt text externalized at `templates/ai-prompt.txt` for easy customization.
  * Compact mode and improved selection helpers (Select all / Invert / Clear).
  * Default PNG branding; override with `REPORT_LOGO`/`GRADE_LOGO_URL`.
  * Report flow integration:
    * `npm run report` can build `dist/docs.html` (using Redocly when available) and `dist/swagger.html` (+ `openapi-bundle.yaml`).
    * Report becomes `dist/index.html` and links to Docs/Swagger are shown in the header.
    * In-app Rebuild button regenerates report/docs/swagger with a centered overlay spinner; disables links and AI controls during rebuild; forces a cache-busting reload.
  * CLI stability:
    * `--generate-only` flag for report CLI to create artifacts without serving (used in tests/CI).
    * New script `npm run report:serve` to serve an existing `dist/`.
    * Soft mode forced during report generation to avoid aborting on errors; serving is non-fatal.
  * Serving:
    * HTML is served with `Cache-Control: no-store` to avoid stale pages.

### Removed

- Deprecated preview and Swagger standalone commands across npm, npx, Makefile, and Docker examples:
  * Removed npm scripts: `preview`, `preview:npx`, `swagger`, `swagger:npx`.
  * Removed CLI bins: `openapi-preview`, `openapi-swagger`.
  * Removed Makefile targets: `preview`, `preview-npx`, `swagger`.
  * Removed Docker usage examples for preview and Swagger UI.
  * Rationale: the HTML report now generates `docs.html` and `swagger.html` and serves them alongside `grade-report.html`, making separate preview/Swagger commands redundant.

## [1.2.0] - 2025-10-18

### Added

- npm CLI package setup (public):
  * Binaries: `openapi-validate`, `openapi-grade`, `openapi-bundle`, `openapi-preview`, `openapi-swagger`.
  * `npm-publish` workflow on tag push (requires `NPM_TOKEN`).
  * Swagger UI preview:
    * `npm run swagger -- <spec> [--port]` (local)
    * `npm run swagger:npx -- <spec> [--port]` (npx)
    * Docker examples for Swagger UI in README.
  * GHCR documentation improvements:
    * Prefer version tags in examples (`:v1.2.0`) and add quick test with `example/openapi.yaml`.
  * CI enhancements:
    * Auto-label release (major/minor/patch) based on Conventional Commits.
    * Auto-version on merge to master (bump + tag), Release, GHCR publish, smoke test.
    * Version check workflow now comments on PR when skipping by label/inference.

### Changed

- README: add npm badges (version/downloads) and GHCR examples using version tags by default.

[1.2.0]: https://github.com/ramongranda/openapi-anyenv-suite/releases
