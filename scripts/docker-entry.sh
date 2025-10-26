#!/bin/sh
# Small entrypoint to make this image usable as:
#  docker run --rm image check <spec>
#  docker run --rm image report <spec>
# If first arg is 'check' or 'report' we run the corresponding pnpm script.
set -e
if [ "$#" -eq 0 ]; then
  echo "Usage: $0 check <spec> | report:static <spec> | serve [port] | --help"
  exit 0
fi
cmd="$1"
shift
case "$cmd" in
  check)
    # Ensure pnpm available (use pnpm 8 for image compatibility)
    corepack prepare pnpm@8 --activate || true
    pnpm install --frozen-lockfile || pnpm install
    exec pnpm run check -- "$@"
    ;;
  report:static)
    corepack prepare pnpm@8 --activate || true
    pnpm install --frozen-lockfile || pnpm install
    # Generate a static index.html (report:static script)
    exec pnpm run report:static -- "$@"
    ;;
  serve)
    # Serve the generated dist/ using vite preview. Optional port as first arg.
    corepack prepare pnpm@8 --activate || true
    pnpm install --frozen-lockfile || pnpm install
    PORT_ARG=${1:-5173}
    shift || true
    exec pnpm run serve:dist -- --port ${PORT_ARG}
    ;;
  --help|-h)
    echo "Usage: $0 check <spec> | report:static <spec> | serve [port] | --help"
    exit 0
    ;;
  *)
    # If first arg looks like a file, treat as spec and run check
    if [ -f "$cmd" ] || echo "$cmd" | grep -qE "\.(yml|yaml|json)$"; then
      corepack prepare pnpm@8 --activate || true
      pnpm install --frozen-lockfile || pnpm install
      exec pnpm run check -- "$cmd" "$@"
    fi
  echo "Unknown command: $cmd"
  echo "Usage: $0 check <spec> | report:static <spec> | serve [port] | --help"
    exit 2
    ;;
esac
