# Copilot Instructions for openapi-anyenv-suite

## Overview
This project is a cross-platform toolkit for validating, grading, and reporting OpenAPI specs. It uses Node.js, Spectral, and Redocly, and is designed for CLI and CI/CD use. The suite is highly opinionated, with custom rules and grading logic.

## Key Components
- **scripts/**: Node.js scripts for bundle, validate, grade, and report workflows. Entry points: `bundle.mjs`, `validate.mjs`, `grade.mjs`, `report-html.mjs`, etc.
- **rules/**: Spectral rulesets (`core.yaml`, `business.yaml`, etc.) and custom JS functions (`rules/functions/`).
- **grade.config.json**: Configurable grading model (penalties, bonuses, grade thresholds).
- **example/**: Sample OpenAPI specs for testing.
- **dist/**: Output directory for reports and bundles.

## Developer Workflows
- **Install dependencies**: `npm install` (or `npm ci` for lockfile)
- **Validate spec**: `npm run validate -- path/to/openapi.yaml`
- **Grade spec**: `npm run grade -- path/to/openapi.yaml`
- **Generate HTML report**: `npm run report -- path/to/openapi.yaml --port 8080`
- **Run tests**: `npm test` (Jest, tests in `test/`)
- **Doctor**: `npm run doctor` (prints tool versions)
- **Makefile**: For Linux/WSL/Git Bash, provides shortcuts for all workflows

## Environment Flags
- `SCHEMA_LINT=1`: Enables Redocly schema lint in validate/grade
- `GRADE_SOFT=1`: Forces zero exit code even on errors (for CI)
- `DEBUG_JSON=1`: Dumps raw linter output to `dist/debug-*.txt` on parse errors

## Project Conventions
- Always pass OpenAPI spec path after `--` in npm scripts
- Custom Spectral rules/functions live in `rules/` and `rules/functions/`
- All scripts are ESM (`.mjs`)
- Node.js 20.19.0+ or 22.12.0+ required (Redocly v2 is ESM-only)
- Prefer local install for reproducibility; npx scripts pin tool versions
- Output artifacts are always written to `dist/`

## CI/CD & Docker
- GitHub Actions workflows for validate, grade, docs, and Docker publish
- Docker image: mount spec and config, outputs to `/work/dist`
- See `docs/CI.md` for reusable workflow details

## Customization
- Edit `grade.config.json` to change grading logic
- Tweak rules in `.spectral.yaml` or `rules/*.yaml`
- Add custom Spectral functions in `rules/functions/`

## Examples
- Validate: `npm run validate -- example/openapi.yaml`
- Grade: `npm run grade -- example/openapi.yaml`
- Serve report: `npm run report -- example/openapi.yaml --port 8080`

## References
- See `README.md` for full usage, environment flags, and troubleshooting
- See `docs/CI.md` for CI and Jenkins integration
- See `rules/` for ruleset structure and custom logic
