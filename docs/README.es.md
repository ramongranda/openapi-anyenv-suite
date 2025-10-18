# OpenAPI Any‑Env Suite (Guía rápida en español)

Herramientas para empaquetar (bundle), lint (Spectral/Redocly), previsualizar y puntuar (A–E) especificaciones OpenAPI. Incluye reglas Spectral de calidad y comandos de línea de comandos (CLI).

## Instalación desde npm (CLI)

Paquete publicado: `@zoomiit/openapi-anyenv-suite`.

```bash
# Instalación global
npm i -g @zoomiit/openapi-anyenv-suite

# Validar
openapi-validate path/to/openapi.yaml
# Grado (con lint de esquema)
SCHEMA_LINT=1 openapi-grade path/to/openapi.yaml
# Preview (Redocly)
openapi-preview path/to/openapi.yaml --port 8080
# Swagger UI
openapi-swagger path/to/openapi.yaml --port 8080
# Bundle
openapi-bundle path/to/openapi.yaml --out dist/bundled.yaml
```

Alternativa local (sin global):

```bash
npm i --save-dev @zoomiit/openapi-anyenv-suite
npx -p @zoomiit/openapi-anyenv-suite openapi-validate path/to/openapi.yaml
```

Notas:

- `SCHEMA_LINT=1` activa lint de esquema Redocly en validación/grado.
- Los comandos hacen bundle antes de lint para resolver `$ref`.

## Docker (GHCR)

Usa siempre la etiqueta de versión para reproducibilidad.

```bash
# Descargar imagen (versión)
docker pull ghcr.io/ramongranda/openapi-anyenv-suite:v2.7.0

# Validar (monta el spec en /spec:ro y dist/ en /work/dist)
docker run --rm \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.7.0 \
  npm run validate -- /spec/openapi.yaml

# Grado (con lint de esquema)
docker run --rm \
  -e SCHEMA_LINT=1 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.7.0 \
  npm run grade -- /spec/openapi.yaml

# Preview (Redocly docs)
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.7.0 \
  npm run preview -- /spec/openapi.yaml --port 8080

# Swagger UI
docker run --rm -p 8080:8080 \
  -v "$PWD/path/to:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.7.0 \
  npm run swagger -- /spec/openapi.yaml --port 8080
```

Prueba rápida (con el ejemplo incluido):

```bash
# Desde la raíz del repo
docker run --rm \
  -v "$PWD/example:/spec:ro" \
  -v "$PWD/dist:/work/dist" \
  ghcr.io/ramongranda/openapi-anyenv-suite:v2.7.0 \
  npm run validate -- /spec/openapi.yaml
```

## Consejos

- Evita montar todo el repo en `/work` (oculta las herramientas internas). Usa `/spec` (solo lectura) y mapea `./dist` a `/work/dist`.
- Node requerido para CLI local: 20.19.0+ o 22.12.0+.
