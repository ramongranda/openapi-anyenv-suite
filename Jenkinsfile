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
  booleanParam(name: 'SCHEMA_LINT', defaultValue: false, description: 'Include Redocly schema lint (optional, requires @redocly/cli in tools)')
    booleanParam(name: 'GRADE_SOFT', defaultValue: false, description: 'Do not fail build on errors during grading')
    string(name: 'TOOLS_REPO', defaultValue: 'https://github.com/ramongranda/openapi-anyenv-suite.git', description: 'Tools repository URL')
    string(name: 'TOOLS_REF', defaultValue: 'develop', description: 'Tools repo branch or tag')
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

    stage('Setup tools') {
      steps {
        // install the tools repository dependencies to ensure local scripts work
        dir('tools') {
          sh '''
            corepack prepare pnpm@8 --activate || true
            pnpm install --frozen-lockfile
          '''
        }
      }
    }

    stage('Validate') {
      when { expression { return params.RUN_VALIDATE } }
      steps {
        sh 'mkdir -p dist'
        script {
          def schemaLint = params.SCHEMA_LINT ? '1' : '0'
          dir('tools') {
            sh """
              corepack prepare pnpm@8 --activate || true
              SCHEMA_LINT=${schemaLint} pnpm run check -- ../"$SPEC_PATH" --no-bundle || true
            """
          }
        }
      }
      post { always { archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true } }
    }

    stage('Check') {
      when { expression { return params.RUN_GRADE } }
      steps {
        script {
          def schemaLint = params.SCHEMA_LINT ? '1' : '0'
          def gradeSoft = params.GRADE_SOFT ? '1' : '0'
          dir('tools') {
            sh """
              corepack prepare pnpm@8 --activate || true
              SCHEMA_LINT=${schemaLint} GRADE_SOFT=${gradeSoft} pnpm run check -- ../"$SPEC_PATH"
            """
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
          dir('tools') {
            corepack prepare pnpm@8 --activate || true
            pnpm run report -- ../"$SPEC_PATH"
          }
        '''
      }
      post { always { archiveArtifacts artifacts: 'dist/index.html', allowEmptyArchive: true } }
    }
  }
}
