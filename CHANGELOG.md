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
  - `dist/grade-report.html` includes summary (score, letter) and tables of Spectral findings and (optionally) Redocly findings when schema lint is enabled.
  - `dist/grade-report.json` remains for automation.
- CI archives both `dist/grade-report.json` and `dist/grade-report.html`.

### Enhanced
- HTML report UX:
  - AI Tools: select issues (errors/warnings), generate/copy prompt; prompt text externalized at `templates/ai-prompt.txt` for easy customization.
  - Compact mode and improved selection helpers (Select all / Invert / Clear).
  - Default PNG branding; override with `REPORT_LOGO`/`GRADE_LOGO_URL`.
- Report flow integration:
  - `npm run report` can build `dist/docs.html` (using Redocly when available) and `dist/swagger.html` (+ `openapi-bundle.yaml`).
  - Report becomes `dist/index.html` and links to Docs/Swagger are shown in the header.
  - In-app Rebuild button regenerates report/docs/swagger with a centered overlay spinner; disables links and AI controls during rebuild; forces a cache-busting reload.
- CLI stability:
  - `--generate-only` flag for report CLI to create artifacts without serving (used in tests/CI).
  - New script `npm run report:serve` to serve an existing `dist/`.
  - Soft mode forced during report generation to avoid aborting on errors; serving is non-fatal.
- Serving:
  - HTML is served with `Cache-Control: no-store` to avoid stale pages.

### Removed
- Deprecated preview and Swagger standalone commands across npm, npx, Makefile, and Docker examples:
  - Removed npm scripts: `preview`, `preview:npx`, `swagger`, `swagger:npx`.
  - Removed CLI bins: `openapi-preview`, `openapi-swagger`.
  - Removed Makefile targets: `preview`, `preview-npx`, `swagger`.
  - Removed Docker usage examples for preview and Swagger UI.
- Rationale: the HTML report now generates `docs.html` and `swagger.html` and serves them alongside `grade-report.html`, making separate preview/Swagger commands redundant.

## [1.2.0] - 2025-10-18

### Added
- npm CLI package setup (public):
  - Binaries: `openapi-validate`, `openapi-grade`, `openapi-bundle`, `openapi-preview`, `openapi-swagger`.
  - `npm-publish` workflow on tag push (requires `NPM_TOKEN`).
- Swagger UI preview:
  - `npm run swagger -- <spec> [--port]` (local)
  - `npm run swagger:npx -- <spec> [--port]` (npx)
  - Docker examples for Swagger UI in README.
- GHCR documentation improvements:
  - Prefer version tags in examples (`:v1.2.0`) and add quick test with `example/openapi.yaml`.
- CI enhancements:
  - Auto-label release (major/minor/patch) based on Conventional Commits.
  - Auto-version on merge to master (bump + tag), Release, GHCR publish, smoke test.
  - Version check workflow now comments on PR when skipping by label/inference.

### Changed
- README: add npm badges (version/downloads) and GHCR examples using version tags by default.

[1.2.0]: https://github.com/ramongranda/openapi-anyenv-suite/releases
