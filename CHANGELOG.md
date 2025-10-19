# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog, and this project adheres to semantic versioning.

## [Unreleased]

### Added
- Grading now generates a human-friendly HTML report alongside JSON:
  - `dist/grade-report.html` includes summary (score, letter) and tables of Spectral/Redocly findings with heuristics.
  - `dist/grade-report.json` remains for automation.
- CI archives both `dist/grade-report.json` and `dist/grade-report.html`.

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
