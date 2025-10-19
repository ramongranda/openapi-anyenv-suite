// Jenkins Declarative Pipeline for OpenAPI validation, grading, and docs
// Copy this file into your API repository and customize SPEC_PATH and toggles.

pipeline {
  agent { docker { image 'node:22-alpine' } }
  options { timestamps() }

  parameters {
    string(name: 'SPEC_PATH', defaultValue: 'spec/openapi.yaml', description: 'Path to OpenAPI spec in this repo')
    booleanParam(name: 'RUN_VALIDATE', defaultValue: true, description: 'Run validation (bundle + Spectral [+ Redocly])')
    booleanParam(name: 'RUN_GRADE', defaultValue: true, description: 'Run grading (produces dist/grade-report.json)')
    booleanParam(name: 'RUN_DOCS', defaultValue: false, description: 'Build docs (dist/index.html)')
    booleanParam(name: 'SCHEMA_LINT', defaultValue: true, description: 'Include Redocly schema lint')
    booleanParam(name: 'GRADE_SOFT', defaultValue: false, description: 'Do not fail build on errors during grading')
    booleanParam(name: 'USE_NPX', defaultValue: true, description: 'Use npx instead of installing local tools')
    string(name: 'TOOLS_REPO', defaultValue: 'https://github.com/ramongranda/openapi-anyenv-suite.git', description: 'Tools repository URL')
    string(name: 'TOOLS_REF', defaultValue: 'master', description: 'Tools repo branch or tag')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh '''
          rm -rf tools
          git clone --depth 1 --branch "$TOOLS_REF" "$TOOLS_REPO" tools
        '''
      }
    }

    stage('Install tools (local mode)') {
      when { expression { return !params.USE_NPX } }
      steps {
        dir('tools') {
          sh 'npm ci'
        }
      }
    }

    stage('Validate') {
      when { expression { return params.RUN_VALIDATE } }
      steps {
        sh 'mkdir -p dist'
        script {
          def schemaLint = params.SCHEMA_LINT ? '1' : '0'
          if (params.USE_NPX) {
            sh """
              npx @redocly/cli@2.7.0 bundle "$SPEC_PATH" --output dist/bundled.yaml
              npx @stoplight/spectral-cli@6.15.0 lint dist/bundled.yaml --ruleset tools/.spectral.yaml --fail-severity error
              if [ "${schemaLint}" = "1" ]; then npx @redocly/cli@2.7.0 lint dist/bundled.yaml; fi
            """
          } else {
            dir('tools') {
              sh """
                SCHEMA_LINT=${schemaLint} \
                npm run validate -- ../"$SPEC_PATH"
              """
            }
          }
        }
      }
      post { always { archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true } }
    }

    stage('Grade') {
      when { expression { return params.RUN_GRADE } }
      steps {
        script {
          def schemaLint = params.SCHEMA_LINT ? '1' : '0'
          def gradeSoft = params.GRADE_SOFT ? '1' : '0'
          if (params.USE_NPX) {
            sh """
              SCHEMA_LINT=${schemaLint} GRADE_SOFT=${gradeSoft} \
              node tools/scripts/grade-npx.mjs "$SPEC_PATH"
            """
          } else {
            dir('tools') {
              sh """
                SCHEMA_LINT=${schemaLint} GRADE_SOFT=${gradeSoft} \
                npm run grade -- ../"$SPEC_PATH"
              """
            }
          }
        }
      }
      post { always { archiveArtifacts artifacts: 'dist/grade-report.*', allowEmptyArchive: true } }
    }

    stage('Docs') {
      when { expression { return params.RUN_DOCS } }
      steps {
        sh '''
          mkdir -p dist
          npx @redocly/cli@2.7.0 build-docs "$SPEC_PATH" --output dist/index.html
        '''
      }
      post { always { archiveArtifacts artifacts: 'dist/index.html', allowEmptyArchive: true } }
    }
  }
}
