# Instrucciones de Copilot para openapi-anyenv-suite

## Resumen
Este proyecto es un conjunto de herramientas multiplataforma para validar, calificar y generar reportes de especificaciones OpenAPI. Utiliza Node.js, Spectral y Redocly, y está diseñado para su uso en CLI y CI/CD. La suite es altamente personalizada, con reglas y lógica de calificación específicas.

## Componentes Clave
- **scripts/**: Scripts en Node.js para flujos de trabajo como empaquetar, validar, calificar y generar reportes. Puntos de entrada: `bundle.mjs`, `validate.mjs`, `grade.mjs`, `report-html.mjs`, etc.
- **rules/**: Conjuntos de reglas de Spectral (`core.yaml`, `business.yaml`, etc.) y funciones personalizadas en JS (`rules/functions/`).
- **grade.config.json**: Modelo de calificación configurable (penalizaciones, bonificaciones, umbrales de calificación).
- **example/**: Especificaciones OpenAPI de ejemplo para pruebas.
- **dist/**: Directorio de salida para reportes y archivos empaquetados.

## Flujos de Trabajo para Desarrolladores
- **Instalar dependencias**: `pnpm install` (o `pnpm ci` para usar el lockfile).
- **Validar especificación**: `pnpm run validate -- path/to/openapi.yaml`
- **Calificar especificación**: `pnpm run grade -- path/to/openapi.yaml`
- **Generar reporte HTML**: `pnpm run report -- path/to/openapi.yaml --port 8080`
- **Ejecutar pruebas**: `pnpm test` (Jest, pruebas en `test/`).
- **Doctor**: `pnpm run doctor` (muestra las versiones de las herramientas).
- **Makefile**: Para Linux/WSL/Git Bash, proporciona atajos para todos los flujos de trabajo.

## Flags de Entorno
- `SCHEMA_LINT=1`: Habilita el lint de esquemas de Redocly en validate/grade.
- `GRADE_SOFT=1`: Fuerza un código de salida cero incluso en errores (para CI).
- `DEBUG_JSON=1`: Vuelca la salida del linter en bruto a `dist/debug-*.txt` en caso de errores de análisis.

## Convenciones del Proyecto
- Siempre pasa la ruta de la especificación OpenAPI después de `--` en los scripts de npm.
- Las reglas/funciones personalizadas de Spectral están en `rules/` y `rules/functions/`.
- Todos los scripts son ESM (`.mjs`).
- Se requiere Node.js 20.19.0+ o 22.12.0+ (Redocly v2 es solo ESM).
- Prefiere la instalación local para reproducibilidad; los scripts npx fijan las versiones de las herramientas.
- Los artefactos de salida siempre se escriben en `dist/`.

## CI/CD y Docker
- Workflows de GitHub Actions para validar, calificar, generar documentación y publicar en Docker.
- Imagen de Docker: monta la especificación y configuración, genera salidas en `/work/dist`.
- Consulta `docs/CI.md` para detalles sobre workflows reutilizables.

## Personalización
- Edita `grade.config.json` para cambiar la lógica de calificación.
- Ajusta las reglas en `.spectral.yaml` o `rules/*.yaml`.
- Agrega funciones personalizadas de Spectral en `rules/functions/`.

## Ejemplos
- Validar: `pnpm run validate -- example/openapi.yaml`
- Calificar: `pnpm run grade -- example/openapi.yaml`
- Servir reporte: `pnpm run report -- example/openapi.yaml --port 8080`

## Referencias
- Consulta `README.md` para uso completo, flags de entorno y resolución de problemas.
- Consulta `docs/CI.md` para integración con CI y Jenkins.
- Consulta `rules/` para la estructura de conjuntos de reglas y lógica personalizada.
