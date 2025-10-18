# @zoomiit/openapi-anyenv-suite

OpenAPI toolkit CLI to bundle, lint, preview, grade, and view Swagger UI.

- Lint: Spectral (custom ruleset) and optional Redocly schema lint
- Bundle: resolve $ref across files before linting
- Preview: Redocly HTML docs and Swagger UI
- Grade: heuristic score (A–E) based on linters + metadata

## Install

```bash
npm i -g @zoomiit/openapi-anyenv-suite
# or local devDependency
npm i --save-dev @zoomiit/openapi-anyenv-suite
```

## CLI

```bash
# Validate (Spectral) – set SCHEMA_LINT=1 to include Redocly
openapi-validate path/to/openapi.yaml
SCHEMA_LINT=1 openapi-validate path/to/openapi.yaml

# Grade (A–E) – fails on errors unless GRADE_SOFT=1
openapi-grade path/to/openapi.yaml
SCHEMA_LINT=1 openapi-grade path/to/openapi.yaml

# Preview (Redocly HTML)
openapi-preview path/to/openapi.yaml --port 8080

# Swagger UI
openapi-swagger path/to/openapi.yaml --port 8080

# Bundle (Redocly)
openapi-bundle path/to/openapi.yaml --out dist/bundled.yaml
```

Environment

- `SCHEMA_LINT=1` include Redocly schema lint
- `GRADE_SOFT=1` do not fail on errors during grading

## npx usage (no install)

```bash
npx -p @zoomiit/openapi-anyenv-suite openapi-validate path/to/openapi.yaml
npx -p @zoomiit/openapi-anyenv-suite openapi-grade path/to/openapi.yaml
```

## Links

- Full docs and Docker usage: <https://github.com/ramongranda/openapi-anyenv-suite>
- Issues: <https://github.com/ramongranda/openapi-anyenv-suite/issues>
