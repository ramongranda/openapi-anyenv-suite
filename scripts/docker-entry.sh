#!/bin/sh
# Small entrypoint to make this image usable as:
#  docker run --rm image check <spec>
#  docker run --rm image report <spec>
# If first arg is 'check' or 'report' we run the corresponding pnpm script.
set -e
if [ "$#" -eq 0 ]; then
  echo "Usage: $0 check <spec> | report <spec> | --help"
  exit 0
fi
cmd="$1"
shift
case "$cmd" in
  check)
    corepack prepare pnpm@10.19.0 --activate || true
    # Prefer frozen lockfile, but fall back to a normal install if it fails in some environments
    pnpm install --frozen-lockfile || pnpm install
    exec pnpm run check -- "$@"
    ;;
  report)
    corepack prepare pnpm@10.19.0 --activate || true
    pnpm install --frozen-lockfile || pnpm install
    exec pnpm run report -- "$@"
    ;;
  --help|-h)
    echo "Usage: $0 check <spec> | report <spec>"
    exit 0
    ;;
  *)
    # If first arg looks like a file, treat as spec and run check
    if [ -f "$cmd" ] || echo "$cmd" | grep -qE "\.(yml|yaml|json)$"; then
      corepack prepare pnpm@10.19.0 --activate || true
      pnpm install --frozen-lockfile || pnpm install
      exec pnpm run check -- "$cmd" "$@"
    fi
    echo "Unknown command: $cmd"
    echo "Usage: $0 check <spec> | report <spec>"
    exit 2
    ;;
esac
