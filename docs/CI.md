# CI Integration Guide

This repo ships reusable CI workflows for GitHub Actions and a ready‑to‑use Jenkinsfile template. They run against your API repo that contains an OpenAPI spec.

Inputs

- `spec_path`: Path to your OpenAPI (e.g., `spec/openapi.yaml`).
- `schema_lint`: `1`/`0` to include Redocly schema lint.
- `grade_soft`: `1`/`0` to not fail grade even with errors.

Artifacts

- Bundle: `dist/bundled-<your-file>.yaml`
- Grade report: `dist/grade-report.json`
- Docs: `dist/index.html`

## GitHub Actions (Reusable)

Reference the workflows in this repo from your API repo.

Validate

```yaml
name: API • Validate
on: [push, pull_request, workflow_dispatch]
jobs:
  validate:
    uses: ramongranda/openapi-anyenv-suite/.github/workflows/openapi-validate.yml@master
    with:
      spec_path: spec/openapi.yaml
      schema_lint: '0'
```

Grade

```yaml
name: API • Grade
on: [pull_request, workflow_dispatch]
jobs:
  grade:
    uses: ramongranda/openapi-anyenv-suite/.github/workflows/openapi-grade.yml@master
    with:
      spec_path: spec/openapi.yaml
      schema_lint: '1'
      grade_soft: '0'
```

Docs

```yaml
name: API • Docs
on: [push, workflow_dispatch]
jobs:
  docs:
    uses: ramongranda/openapi-anyenv-suite/.github/workflows/openapi-docs.yml@master
    with:
      spec_path: spec/openapi.yaml
```

## Jenkins (Declarative Pipeline)
Use the Jenkinsfile template included at the repository root. Copy `Jenkinsfile` to your API repo and adjust parameters if needed. It supports both npx‑only and local tools installation, checks out this tools repo under `tools/`, and archives artifacts.

Parameters
- `SPEC_PATH` (string): path to your OpenAPI (default: `spec/openapi.yaml`).
- `RUN_VALIDATE` (bool): enable validation stage.
- `RUN_GRADE` (bool): enable grading stage.
- `RUN_DOCS` (bool): build HTML docs.
- `SCHEMA_LINT` (bool): include Redocly schema lint.
- `GRADE_SOFT` (bool): do not fail build on errors during grading.
- `USE_NPX` (bool): use npx instead of installing local tools.
- `TOOLS_REPO` (string): tools repo URL (default: this repository URL).
- `TOOLS_REF` (string): branch or tag (default: `master`).

Notes
- In npx mode, Spectral uses the ruleset from `tools/.spectral.yaml`.
- Artifacts are archived from `dist/` for each stage.
