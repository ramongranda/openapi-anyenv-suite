# CI Integration Guide

This repo ships reusable CI workflows for GitHub Actions and a Jenkins pipeline example. They run against your API repo that contains an OpenAPI spec.

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

Place this `Jenkinsfile` in your API repo. It supports both npx-only and local tools installation.

```groovy
pipeline {
  agent { docker { image 'node:22-alpine' } }
  options { timestamps() }
  parameters {
    string(name: 'SPEC_PATH', defaultValue: 'spec/openapi.yaml')
    booleanParam(name: 'RUN_VALIDATE', defaultValue: true)
    booleanParam(name: 'RUN_GRADE', defaultValue: true)
    booleanParam(name: 'RUN_DOCS', defaultValue: false)
    booleanParam(name: 'SCHEMA_LINT', defaultValue: true)
    booleanParam(name: 'GRADE_SOFT', defaultValue: false)
    booleanParam(name: 'USE_NPX', defaultValue: true)
  }
  stages {
    stage('Validate') {
      when { expression { params.RUN_VALIDATE } }
      steps {
        sh '''
          mkdir -p dist
          if ${USE_NPX}; then
            npx @redocly/cli@2.7.0 bundle ${SPEC_PATH} --output dist/bundled.yaml
            npx @stoplight/spectral-cli@6.15.0 lint dist/bundled.yaml --ruleset .spectral.yaml --fail-severity error
            if ${SCHEMA_LINT}; then npx @redocly/cli@2.7.0 lint dist/bundled.yaml; fi
          else
            npm ci
            SCHEMA_LINT=$([ ${SCHEMA_LINT} = true ] && echo 1 || echo 0) npm run validate -- ${SPEC_PATH}
          fi
        '''
      }
      post { always { archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true } }
    }
    stage('Grade') {
      when { expression { params.RUN_GRADE } }
      steps {
        sh '''
          if ${USE_NPX}; then
            node scripts/grade-npx.mjs ${SPEC_PATH}
          else
            npm ci
            SCHEMA_LINT=$([ ${SCHEMA_LINT} = true ] && echo 1 || echo 0) \
            GRADE_SOFT=$([ ${GRADE_SOFT} = true ] && echo 1 || echo 0) \
            npm run grade -- ${SPEC_PATH}
          fi
        '''
      }
      post { always { archiveArtifacts artifacts: 'dist/grade-report.json', allowEmptyArchive: true } }
    }
    stage('Docs') {
      when { expression { params.RUN_DOCS } }
      steps {
        sh '''
          npx @redocly/cli@2.7.0 build-docs ${SPEC_PATH} --output dist/index.html
        '''
      }
      post { always { archiveArtifacts artifacts: 'dist/index.html', allowEmptyArchive: true } }
    }
  }
}
```

