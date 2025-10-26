# Contributing Guide

Thanks for your interest in improving OpenAPI Any‑Env Suite. This guide explains how to set up your environment, make changes safely, and submit high‑quality pull requests.

## Project Goals

- Provide a portable toolkit to bundle, lint, grade, and report on OpenAPI specs.
- Keep scripts minimal, cross‑platform, and predictable (Windows, Linux, WSL, Docker).
- Maintain clear, English messages and documentation.

## Getting Started

1. Requirements

- Node.js 20.19.0+ or 22.12.0+
- pnpm

1. Install

```bash
pnpm install --frozen-lockfile
```

1. Quick checks

```bash
# Validate the example spec
pnpm run check -- example/openapi.yaml
# Generate HTML report (static)
pnpm run report:static -- example/openapi.yaml
```

## Development Workflow

- Branching: `feat/<short>`, `fix/<short>`, `chore/<short>`, `docs/<short>`, `ci/<short>`
- Commits: follow Conventional Commits (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `ci: ...`)
- Small PRs: keep changes scoped and focused.
- Keep versions aligned:
  - `package.json` devDependencies
  - npx scripts pins
  - README badges

## Coding Guidelines

- Scripts: keep them simple, with clear console messages and non‑interactive defaults.
- Encoding: save files as UTF‑8; avoid mojibake and emoji‑like prefixes in logs.
- Paths: prefer relative paths; keep outputs under `dist/`.
- Messages/Docs: write in English.

## Spectral Rules Contributions

- Root ruleset: `.spectral.yaml` extends local packs in `rules/`.
- Packs live in `rules/*.yaml` by domain (core, business, format, pagination, security).
- Custom functions go in `rules/functions/` (CommonJS `module.exports = ...`).
- Prefer descriptive rule names and concise descriptions.
- Severity source of truth: per‑pack YAMLs; avoid duplicating a rule’s severity in the root unless intentionally overriding.
- Test your rule with the example spec or add a minimal snippet under `example/` to exercise it.

Checklist for new/changed rules

- Add/adjust rule in the appropriate `rules/*.yaml` file.
- If needed, add a function in `rules/functions/` using CommonJS.
- Run:

  ```bash
  pnpm run check -- example/openapi.yaml
  SCHEMA_LINT=1 pnpm run check -- example/openapi.yaml
  ```

- Ensure messages are clear and in English.

## CI & Automation

- GitHub Actions: reusable workflows are provided for validate/grade/docs.
- Jenkins: a ready-to-use `Jenkinsfile` template and a `Jenkinsfile.runner` for testing via Jenkinsfile Runner in Actions.
- Artifacts: bundle(s), grade report, and docs are stored under `dist/`.

### Release Process (develop → master)

- Branching model: work on feature branches from `develop`; merge via PRs into `develop`.
- To cut a release, open a PR from `develop` (or a release branch) into `master`.
  - The CI auto-labels the PR based on Conventional Commits (title/commits). If no clear signal is found, the default is `release:minor`.
  - You can override by applying `release:major` or `release:patch` explicitly.
- On merge to `master`, the Auto Version workflow will:
  - Run `npm version <type>` to bump `package.json`
  - Commit and create tag `v<version>`; push to origin
  - Trigger the Release workflow (GitHub Release), Docker publish to GHCR (`latest` and `v<version>`), and the Docker smoke test
- The PR version-bump check is skipped if a release label is present (auto-labeled by CI when possible).

## Docker

- Optional: Build with BuildKit for faster, cleaner builds.

```bash
export DOCKER_BUILDKIT=1
docker build -t openapi-tools .
```

## Opening a Pull Request

- Describe the change and rationale.
- Note any trade-offs or follow-ups.
- Include before/after examples where useful (e.g., error output changes).
- Keep the PR limited to the stated goal (avoid unrelated refactors).

Release PRs
- Target: `master`
- Label is applied automatically by CI (default `release:minor`); you may override with `release:major` or `release:patch`.
- No need to bump `package.json` manually; the merge will auto-bump and tag.

Thank you for contributing!
