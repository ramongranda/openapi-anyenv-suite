CI/CD - GitHub Actions

Este documento resume los workflows añadidos por la automatización y los secretos/permisos requeridos.

Workflows añadidos

- `.github/workflows/ci.yml` — Ejecuta tests y un "soft grade" (no bloqueante) en pushes y PRs sobre `develop` y `main`.
- `.github/workflows/publish-npm.yml` — Publica el paquete en npm cuando se hace push en `master` (merge final) o manualmente mediante `workflow_dispatch`.
- `.github/workflows/docker-publish.yml` — Construye la imagen (multi-arch) y la publica en GitHub Container Registry (GHCR) cuando se hace push en `master` (merge final) o manualmente mediante `workflow_dispatch`.

Secrets / permisos necesarios

1) NPM_TOKEN (secret)
- Tipo: Automation token de npm (Automation token desde https://www.npmjs.com/settings/<your-user>/tokens)
- Se usa en `publish-npm.yml` para autenticar `npm publish`.
- Añadirlo en Settings → Secrets → Actions con el nombre `NPM_TOKEN`.

2) GHCR publishing
- Para publicar en GHCR usamos `GITHUB_TOKEN` y hemos ajustado permisos del workflow a `packages: write`.
- No se requiere un PAT adicional si el workflow corre en este repo y `GITHUB_TOKEN` tiene permisos para `packages: write`. Si su política org requiere un PAT, cree un secret `GHCR_PAT` y actualice el workflow para usarlo en lugar de `GITHUB_TOKEN`.

Cómo publicar

 - Publicación a npm y Docker: diseñada para ejecutarse tras mergear a `master` (push a la rama). Asegúrate de que `package.json` contiene la versión correcta antes del merge. También puedes ejecutar los workflows manualmente desde Actions → Run workflow.

Notas y recomendaciones

- Asegúrese de que `package.json` tenga `private: false` y `publishConfig.access: public`. (Ya está configurado en este repo.)
- Recomendado: use etiquetas semánticas `vMAJOR.MINOR.PATCH` para activar publish workflows.
- Si desea publicar imágenes a otro registro (p.ej. Docker Hub), adapte `docker-publish.yml` para usar `docker/login-action` con las credenciales adecuadas.

Ejemplo rápido (crear etiqueta desde local):

PowerShell (Windows):

```powershell
CI/CD - GitHub Actions

Este documento resume los workflows añadidos por la automatización y los secretos/permisos requeridos.

Workflows añadidos

- `.github/workflows/ci.yml` — Ejecuta tests y un "soft grade" (no bloqueante) en pushes y PRs sobre `develop` y `main`.
- `.github/workflows/publish-npm.yml` — Publica el paquete en npm cuando se hace push en `main` o cuando se publica un tag `v*`, o manualmente mediante `workflow_dispatch`.
- `.github/workflows/docker-publish.yml` — Construye la imagen (multi-arch) y la publica en GitHub Container Registry (GHCR) en `develop`/`main`/tags según la política (develop -> latest; main/tags -> version+latest).
- `.github/workflows/release.yml` — Flujo de release automático: cuando una Pull Request hacia `master` recibe una etiqueta `release:*` (p.ej. `release:minor` o `release:1.2.3`), el workflow ejecuta tests, calcula/ajusta la versión, publica en npm y GHCR, mergea a `master` y crea una PR a `develop` con la siguiente versión snapshot.

Secrets / permisos necesarios

1) NPM_TOKEN (secret)

- Tipo: Automation token de npm (crea uno en https://www.npmjs.com/settings/<tu-usuario>/tokens)
- Se usa en `publish-npm.yml` o en `release.yml` para autenticar `npm publish`.
- Añadirlo en Settings → Secrets → Actions con el nombre `NPM_TOKEN`.

2) GHCR publishing

- Para publicar en GHCR usamos `GITHUB_TOKEN` y los workflows requieren `packages: write` en sus permisos.
- No se requiere un PAT adicional si el workflow corre en este repo y `GITHUB_TOKEN` tiene permisos para `packages: write`. Si su política org requiere un PAT, crea un secret `GHCR_PAT` y actualiza los pasos de login para usarlo en lugar de `GITHUB_TOKEN`.

Cómo publicar (flujo recomendado)

- Publicación a npm y Docker: diseñada para ejecutarse tras mergear a `master`. Configura protección de rama para `master` que requiera que los checks de CI pasen antes de permitir merges.
- Para lanzar un release automatizado: agrega la etiqueta `release:*` a la Pull Request apuntando a `master` (p.ej. `release:minor` o `release:1.2.3`). El workflow `release.yml` se encargará del resto.

Etiquetas de release

- La PR destinada a `master` debe contener una etiqueta `release:*` para activar el proceso de release. Formatos permitidos:
 - La PR destinada a `master` debe contener una etiqueta `release:*` para activar el proceso de release. Formatos permitidos:
	 - `release:major`, `release:minor`, `release:patch` — la versión se calculará automáticamente a partir de `package.json`.
	 - `release:X.Y.Z` — versión fijada (pinned). En este caso la versión de `package.json` se actualizará a `X.Y.Z`.

- Si la etiqueta no está presente o no tiene el formato correcto, el workflow fallará y añadirá un comentario en la PR pidiendo que se ponga la etiqueta adecuada.

Comportamiento tras release exitoso

- El workflow `release.yml`:
 - El workflow `release.yml`:
	 1. Ejecuta tests en la rama de la PR.
	 2. Bumpea `package.json` según la etiqueta (o establece la versión fijada).
	 3. Crea un tag `vX.Y.Z` y publica en npm.
	 4. Construye y publica las imágenes en GHCR (version + latest).
	 5. Mergea la PR a `master` automáticamente.
	 6. Crea una nueva branch desde `master` con la siguiente versión snapshot (patch+1 + `-SNAPSHOT`) y abre una PR hacia `develop` con ese cambio.

Seguridad y permisos

- El workflow usa el `GITHUB_TOKEN` para mergear y crear la PR a `develop`. Asegúrate de que las protecciones de `master` permitan la ejecución de workflows con el token que tenga permisos de escritura para completar merges automatizados.

Ejemplo rápido (crear etiqueta desde local):

PowerShell (Windows):

```powershell
# CI/CD - GitHub Actions

Este documento resume los workflows añadidos por la automatización y los secretos/permisos requeridos.

## Workflows añadidos

- `.github/workflows/ci.yml` — Ejecuta tests y un "soft grade" (no bloqueante) en pushes y PRs sobre `develop` y `main`.
- `.github/workflows/publish-npm.yml` — Publica el paquete en npm cuando se hace push en `main` o cuando se publica un tag `v*`, o manualmente mediante `workflow_dispatch`.
- `.github/workflows/docker-publish.yml` — Construye la imagen (multi-arch) y la publica en GitHub Container Registry (GHCR) en `develop`/`main`/tags según la política (develop -> latest; main/tags -> version+latest).
- `.github/workflows/release.yml` — Flujo de release automático: cuando una Pull Request hacia `master` recibe una etiqueta `release:*` (p.ej. `release:minor` o `release:1.2.3`), el workflow ejecuta tests, calcula/ajusta la versión, publica en npm y GHCR, mergea a `master` y crea una PR a `develop` con la siguiente versión snapshot.

## Secrets / permisos necesarios

1) NPM_TOKEN (secret)

- Tipo: Automation token de npm (crea uno en https://www.npmjs.com/settings/<tu-usuario>/tokens)
- Se usa en `publish-npm.yml` o en `release.yml` para autenticar `npm publish`.
- Añadirlo en Settings → Secrets → Actions con el nombre `NPM_TOKEN`.

2) GHCR publishing

- Para publicar en GHCR usamos `GITHUB_TOKEN` y los workflows requieren `packages: write` en sus permisos.
- No se requiere un PAT adicional si el workflow corre en este repo y `GITHUB_TOKEN` tiene permisos para `packages: write`. Si su política org requiere un PAT, crea un secret `GHCR_PAT` y actualiza los pasos de login para usarlo en lugar de `GITHUB_TOKEN`.

## Cómo publicar (flujo recomendado)

- Publicación a npm y Docker: diseñada para ejecutarse tras mergear a `master`. Configura protección de rama para `master` que requiera que los checks de CI pasen antes de permitir merges.
- Para lanzar un release automatizado: agrega la etiqueta `release:*` a la Pull Request apuntando a `master` (p.ej. `release:minor` o `release:1.2.3`). El workflow `release.yml` se encargará del resto.

## Etiquetas de release

- La PR destinada a `master` debe contener una etiqueta `release:*` para activar el proceso de release. Formatos permitidos:
	- `release:major`, `release:minor`, `release:patch` — la versión se calculará automáticamente a partir de `package.json`.
	- `release:X.Y.Z` — versión fijada (pinned). En este caso la versión de `package.json` se actualizará a `X.Y.Z`.

- Si la etiqueta no está presente o no tiene el formato correcto, el workflow fallará y añadirá un comentario en la PR pidiendo que se ponga la etiqueta adecuada.

## Comportamiento tras release exitoso

- El workflow `release.yml`:
	1. Ejecuta tests en la rama de la PR.
	2. Bumpea `package.json` según la etiqueta (o establece la versión fijada).
	3. Crea un tag `vX.Y.Z` y publica en npm.
	4. Construye y publica las imágenes en GHCR (version + latest).
	5. Mergea la PR a `master` automáticamente.
	6. Crea una nueva branch desde `master` con la siguiente versión snapshot (patch+1 + `-SNAPSHOT`) y abre una PR hacia `develop` con ese cambio.

## Seguridad y permisos

- El workflow usa el `GITHUB_TOKEN` para mergear y crear la PR a `develop`. Asegúrate de que las protecciones de `master` permitan la ejecución de workflows con el token que tenga permisos de escritura para completar merges automatizados.

## Ejemplo rápido (crear etiqueta desde local)

PowerShell (Windows):

```powershell
git tag v2.14.0
git push origin v2.14.0
```

Tras pushear, GitHub Actions iniciará los workflows de release and publish (según configuración y eventos).
