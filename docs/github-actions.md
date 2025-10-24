# GitHub Actions (CI/CD)

This document summarizes repository workflows, required secrets and permissions for CI, npm publishing and Docker image publishing.

WORKFLOWS

- .github/workflows/ci.yml - runs tests and a non-blocking (soft) grade on pushes and PRs to 'develop' and 'main'.
- .github/workflows/publish-npm.yml - runs semantic-release and publishes the package to npm when changes are pushed to the release branch ('main') or when run manually.
- .github/workflows/docker-publish.yml - builds multi-arch Docker images and pushes them to GitHub Container Registry (GHCR) when releases/tags are created (by semantic-release) or manually via workflow_dispatch.
- .github/workflows/release.yml - optional label-driven release flow: when a PR into 'main' receives a 'release:*' label, the workflow prepares the release and delegates publishing to the semantic-release runner on 'main'.

SECRETS AND PERMISSIONS

- NPM_TOKEN (required): npm automation token for publishing. Add under Settings -> Secrets -> Actions as 'NPM_TOKEN'.
- GITHUB_TOKEN: provided automatically to Actions. Workflows may require 'contents: write' and 'packages: write' to push tags, create releases and publish packages. Check repo Settings -> Actions -> Workflow permissions.
- Optional GHCR_PAT: a personal access token with write:packages if your org blocks GITHUB_TOKEN from publishing packages. Add as a secret (e.g. 'GHCR_PAT') and update Docker login steps if needed.

PUBLISHING FLOW (recommended)

1) Merge PRs into 'develop' and ensure CI passes.
2) Merge into 'main' to create a release. semantic-release runs on 'main', computes the next version, creates a tag (eg: v1.2.3), publishes to npm and creates a GitHub Release.
3) The Docker publish workflow triggers on the created tag, builds multi-arch images and pushes to GHCR. A smoke-test job pulls the published image and runs 'pnpm run check' to validate artifacts.

LABEL-DRIVEN RELEASES

- Apply a label 'release:*' to a PR targeting 'main' to trigger the label-driven flow. Supported labels:
  - 'release:major', 'release:minor', 'release:patch' - semantic-release computes the version
  - 'release:X.Y.Z' - pinned version; the workflow will set package.json to that version
- If the label is missing or malformed, the release workflow will comment on the PR asking for the correct label.

BRANCH PROTECTION

- Protect the 'main' branch to require status checks before merging. Workflows that create tags or merge PRs need write permissions; if the default GITHUB_TOKEN is restricted by org policy use a PAT for those steps.

MANUAL RUNS

- The publish workflows include 'workflow_dispatch' so they can be run manually from the Actions UI for emergencies or testing. Prefer automated semantic-release runs for consistency.

QUICK EXAMPLE (PowerShell)

powershell> git tag v2.14.0
powershell> git push origin v2.14.0

After pushing the tag, GitHub Actions will start Docker publish and smoke-test workflows according to events.

NOTES

- Ensure package.json contains 'private: false' and 'publishConfig.access: public' for public npm publishing.
- Use semantic tags 'vMAJOR.MINOR.PATCH' created by semantic-release so package and image versions stay consistent.
- To publish to another registry (eg Docker Hub) adjust docker-publish.yml to use docker/login-action with suitable secrets.

NEXT STEPS

If you want, I can:
- Add a small workflow that runs 'semantic-release --dry-run' in PRs so maintainers can preview the release version.
- Remove runtime install steps from release workflows now that 'conventional-changelog-conventionalcommits' is in devDependencies.

Tell me which you prefer and I will implement it.
