<p align="center">
  <img src="../assets/logo-oas.png" alt="OAS logo" width="120" height="120" />
</p>

# @zoomiit/openapi-anyenv-suite

OpenAPI toolkit CLI to bundle, lint, grade, and generate a report.

- Lint: Spectral (custom ruleset) and optional Redocly schema lint
- Bundle: resolve $ref across files before linting
- Grade: heuristic score (A-E) based on linters + metadata
 - Report: generates HTML/JSON artifacts; includes Docs and Swagger pages

## CLI (install)

Install locally and use the canonical entrypoints exposed in `package.json`.

```bash
# Install dependencies
npm ci

# Validate + grade
pnpm run check -- path/to/openapi.yaml

# Generate / serve report
pnpm run report -- path/to/openapi.yaml --port 8080
```

Outputs

- Grading writes `dist/grade-report.json` (machine-readable) and `dist/grade-report.html` (human-friendly).
 - To preview the HTML in a local server: `pnpm run report <spec> --port 8080` then open `http://127.0.0.1:8080/grade-report.html`.

Environment

- `SCHEMA_LINT=1` include Redocly schema lint
- `GRADE_SOFT=1` do not fail on errors during grading

> Note: NPX/shim variants have been removed from the toolkit to simplify maintenance. Use the `check` and `report` entrypoints above.

## Links

- Full docs and Docker usage: <https://github.com/ramongranda/openapi-anyenv-suite>
- Issues: <https://github.com/ramongranda/openapi-anyenv-suite/issues>
