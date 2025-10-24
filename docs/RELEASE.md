# Release Guide

This document describes the release process used by this repository: semantic-release-driven npm publishing and Docker image publishing to GHCR. It includes quick checks, dry-run commands, rollback steps and common troubleshooting tips.

## Overview

- Releases are automated with `semantic-release` and run on the release branch (`main` or `master`) only.
- `semantic-release` computes the new version from conventional commits, creates a Git tag (e.g. `v1.2.3`), publishes to npm and creates a GitHub Release.
- A separate GitHub Actions workflow listens for tags and builds/pushes Docker images to GHCR (multi-arch). A smoke-test job pulls the image and runs `pnpm run check` to validate the produced artifacts.

## Prerequisites

- Repository secrets:
  - `NPM_TOKEN` (required) — npm automation token with `publish` scope.
  - `GITHUB_TOKEN` — provided by Actions automatically; ensure repo Actions permissions allow tags/releases and packages if your org restricts it.
  - Optional `GHCR_PAT` if your org blocks `GITHUB_TOKEN` for package publishing.
- Ensure `package.json` has `private: false` and `publishConfig.access: public` (if publishing to the public npm registry).
- Protect the release branch in GitHub (require CI status checks and disallow direct pushes).

## Typical release flow (automated)

1. Merge feature/fix PRs into `develop` as usual. Ensure CI passes on the PR.
2. When ready to release, merge changes into `main` (the release branch).
3. On push to `main`, semantic-release runs (configured in `.releaserc.json`):
   - It analyses commits, decides release type (major/minor/patch), updates the changelog, creates a tag `vX.Y.Z`, publishes the package to npm, and creates a GitHub Release.
4. The Docker publish workflow detects the tag and builds/pushes images to GHCR and runs the smoke test.

## Dry-run: simulate a release locally

To see what semantic-release would do without publishing:

PowerShell example (Windows):

```powershell
# set tokens in the environment (temporary for the session)
$env:NPM_TOKEN = 'xxxx'
npx semantic-release --dry-run
```

Notes:
- `--dry-run` prints the actions semantic-release would take (version bump, changelog entries, releases) but does not create tags or publish.
- Provide `NPM_TOKEN` and `GITHUB_TOKEN` if you want to simulate authenticated steps; otherwise dry-run still shows the computed version.

## Dry-run for Docker build (locally validate image build)

Use Docker buildx to locally build the same multi-arch image used in CI:

```bash
# create and bootstrap buildx builder once
docker buildx create --name release-builder --use || true
docker buildx inspect --bootstrap
# build the image locally (no push)
docker buildx build --platform linux/amd64,linux/arm64 -t openapi-anyenv-suite:local --load .
# run smoke check
docker run --rm -v "${PWD}/dist:/work/dist" openapi-anyenv-suite:local pnpm run check -- /spec/openapi.yaml
```

## Rollback a release (npm + GHCR)

If a published release must be reverted:

1. Unpublish from npm only for very recent mistakes and only if allowed by npm policy (note: npm discourages unpublishing old versions). Prefer deprecating the package version instead:

```bash
# deprecate the bad version
npm deprecate @zoomiit/openapi-anyenv-suite@1.2.3 "This release contains a regression; use 1.2.4"
```

2. Remove Docker images from GHCR (use GitHub Packages UI or the API) for the specific tag if necessary.

3. Create a follow-up release that fixes the issue and publishes a new version. Do not delete Git tags from the `main` branch unless you intend to re-run and re-tag with a corrected version. If you must delete a tag, ensure you coordinate with CI and consumers.

## Re-run a failed release on GitHub Actions

- Use the GitHub Actions UI: go to the semantic-release workflow run and select "Re-run jobs" or "Re-run failed jobs". If the failure was due to a transient network error or timeout, this is usually sufficient.
- If the failure was due to missing secrets or permissions, fix the secret/permission and re-run.
- If a tag was created but publishing failed, you may need to delete the tag and let semantic-release re-create it. Be cautious: deleting tags that other systems rely on can be disruptive.

## Common troubleshooting tips

- Authentication errors when publishing to npm:
  - Ensure `NPM_TOKEN` is set in repository secrets and has `publish` privilege.
  - In CI logs, verify semantic-release step prints `authenticated` for npm.
- Permission errors pushing to GHCR or creating releases:
  - Check Actions permissions in repo Settings → Actions → General. Some organizations restrict `GITHUB_TOKEN` write permissions to contents or packages.
  - If necessary, create a `GHCR_PAT` with `write:packages` scope and set it in repo secrets; modify the workflow to use it.
- Version mismatch between tag and package.json:
  - semantic-release controls `package.json` changes and tags. Avoid manually changing `package.json` version on the release branch; let semantic-release manage this.
- Smoke-test fails (image run does not produce `dist/grade-report.json`):
  - Re-run the job logs to see container stdout. Confirm the image has `pnpm` and that the check command runs against the expected spec path.

## Helpful commands

Run unit tests and grading locally:

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm run check -- example/openapi.yaml
```

Semantic-release dry-run:

```powershell
# runs locally and shows computed version and steps
npx semantic-release --dry-run
```

Create a release branch and PR (Git example):

```bash
git checkout -b docs/release-guidelines
git add docs/RELEASE.md
git commit -m "docs(release): add RELEASE.md guide"
git push -u origin docs/release-guidelines
# create PR with GitHub CLI (if available)
gh pr create --base develop --title "docs(release): add RELEASE.md guide" --body "Adds a release troubleshooting and dry-run guide"
```

## Want help?

If you'd like, I can:

- Open the PR for you (I will push the branch and run `gh pr create` — requires that `gh` is available and authenticated locally), or
- Push the branch and give you the exact `gh` command to run, or
- Create a GitHub API PR (requires a GH token with repo access) if you prefer an automated API call.

Pick one option and I'll proceed.
# Release Guide

This document explains the release process for this repository. It covers the automated flow (semantic-release), local dry-runs, common troubleshooting steps, and how to rollback or re-run a release.

## Overview

- Releases are driven by `semantic-release`. The CI is configured so that `semantic-release` runs on the `main` branch and creates Git tags (for example `v1.2.3`), changelogs and GitHub Releases. npm publishing is handled by `semantic-release` via the `@semantic-release/npm` plugin.
- Docker images are built and pushed to GitHub Container Registry (GHCR) by a separate workflow that triggers on tags created by `semantic-release`. This ensures package and image versions are consistent.

## Prerequisites

- Repository secrets (Settings → Secrets):
  - `NPM_TOKEN` — npm automation token with `publish` rights.
  - `GITHUB_TOKEN` — provided automatically to GitHub Actions. Ensure Actions have permissions to create releases and push tags/packages.
  - Optional: `GHCR_PAT` — personal access token with `write:packages` if your org blocks `GITHUB_TOKEN` for package pushes.

- `package.json` must have `private: false` and the correct `name` and `version` fields for publishing.

## Typical automated flow

1. Work is merged into `develop` via PRs.
2. When changes are ready for a release, they are merged into `main`.
3. A push to `main` runs CI. If CI passes, `semantic-release` runs and determines the next version based on conventional commits.
4. `semantic-release` publishes to npm, creates a Git tag `vX.Y.Z` and a GitHub Release.
5. The Docker workflow detects the tag, builds multi-arch images and pushes them to GHCR. A smoke-test job pulls the image and runs `pnpm run check` to confirm the artifact is valid.

## Local dry-run of semantic-release

To inspect what `semantic-release` would do without publishing anything, use the dry-run mode. Provide tokens as environment variables so semantic-release can simulate remote operations.

PowerShell example:

```powershell
# set tokens in the shell (temporary)
$env:NPM_TOKEN = 'npm_token_here'
$env:GITHUB_TOKEN = 'gh_token_here'

# run a dry-run
npx semantic-release --dry-run
```

The `--dry-run` output shows the computed next version, the release notes and the list of assets that would be published.

## Manual publish (workflow dispatch)

If you enabled `workflow_dispatch` for the publish workflow, you can run the Action manually from the Actions tab. Prefer semantic-release automation; manual dispatch is useful for emergencies.

## Re-running a failed release

- Preferred: re-run the failed Actions job from the GitHub UI (Actions → workflow run → Re-run jobs).
- If the run failed during `semantic-release` after a tag was partially created, inspect the run logs to determine which step failed (npm publish, GH release, git push). Common fixes:
  - If npm publish failed due to auth, verify `NPM_TOKEN` in Secrets and retry.
  - If GH release failed, confirm `GITHUB_TOKEN` permissions.

If you need to force a new release attempt, you can either:

- Re-run the workflow (preferred). Or:
- Create a new commit on `main` (an empty commit) and push it so `semantic-release` re-runs and will compute the same or a newer version:

```powershell
git checkout main
git pull origin main
git commit --allow-empty -m "chore(release): retry release"
git push origin main
```

## Rollback a published npm release

- npm does not support unpublishing versions older than 72 hours on the public registry for scoped packages. Recommended approach:
  - Deprecate the bad version so users are warned:

```powershell
npm deprecate @your-scope/your-package@1.2.3 "This release contained a bug. Please upgrade to x.y.z"
```

  - Publish a patch release with the fix following conventional commits and let semantic-release publish the new version.

- If you must remove a tag from GitHub:

```powershell
# delete local tag
git tag -d v1.2.3
# delete remote tag
git push origin :refs/tags/v1.2.3
```

Note: deleting tags does not remove the npm package version; use `npm deprecate` for public registries.

## Rollback a Docker image on GHCR

- To remove a tag from GHCR, you can delete the tag in the Packages UI or use the REST API to remove the package or the specific tag. Prefer unlisting/deprecating to destructive deletes when others may rely on the image.

## Smoke-test verification

- The Docker publish workflow includes a smoke-test that pulls the published image and runs `pnpm run check` against the bundled example or a supplied spec. To replicate locally:

```powershell
docker pull ghcr.io/OWNER/REPO:v1.2.3
docker run --rm ghcr.io/OWNER/REPO:v1.2.3 pnpm run check -- /spec/openapi.yaml
```

Replace `OWNER/REPO` and the tag accordingly.

## Troubleshooting tips

- Inspect Action logs for the failing step (semantic-release, npm publish, docker build, etc.).
- Check that `pnpm install` succeeds in CI and that the pnpm cache is not corrupted. If CI shows transient network failures, re-run the job.
- If `semantic-release` reports missing permissions, ensure `GITHUB_TOKEN` has repo:status/contents/packages permissions (or use a dedicated PAT).
- For docker push permission issues, ensure `GITHUB_TOKEN` or `GHCR_PAT` has `write:packages` scope and Actions permissions allow package writes.

## Branch protection (recommended)

- Protect `main` with the following rules:
  - Require status checks to pass before merging (include the CI job and any security checks).
  - Require pull request reviews before merging.
  - Restrict who can push to `main` (admins excluded as preferred).

## Quick checklist before merging to `main`

- [ ] All CI checks passed on the PR.
- [ ] Tests and grading (`pnpm run check`) succeed locally or in CI.
- [ ] Changelog or release notes look correct (semantic-release generates them automatically; verify on the release candidate run if needed).
- [ ] `package.json` version is not manually modified — semantic-release manages versions.

## Want me to add more?

If you want, I can:

- Add a small helper workflow that runs `semantic-release --dry-run` in PRs (CI-only) so maintainers can preview the release version.
- Add a `Makefile` target or `scripts/release-check.mjs` that performs preflight checks locally.

Tell me which of the above you'd like and I will add it.
