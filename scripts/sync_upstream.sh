#!/usr/bin/env bash
# Bring new upstream (grapeseed-localizer-web) changes into this demo.
# This repo does not share upstream's git history, so the changes come over as
# a patch: upstream diff from the commit in .upstream-commit to the given ref.
#
# Usage: scripts/sync_upstream.sh [upstream-checkout] [upstream-ref]
#   defaults: ../grapeseed-localizer-web HEAD
set -euo pipefail

UPSTREAM=${1:-../grapeseed-localizer-web}
REF=${2:-HEAD}
FROM=$(cat .upstream-commit)
TO=$(git -C "$UPSTREAM" rev-parse "$REF")

if [ "$FROM" = "$TO" ]; then
  echo "Already in step with upstream $TO"
  exit 0
fi

PATCH=$(mktemp)
trap 'rm -f "$PATCH"' EXIT

# Files this demo removed or owns are left out; the lockfile is rebuilt by npm.
git -C "$UPSTREAM" diff --binary "$FROM" "$TO" -- . \
  ':(exclude)package-lock.json' \
  ':(exclude).env' \
  ':(exclude).env.example' \
  ':(exclude)refresh-npm-token.sh' \
  ':(exclude)src/lib/auth.ts' \
  ':(exclude)src/pages/auth' \
  ':(exclude)src/components/auth_splash.tsx' \
  ':(exclude)src/types/env.d.ts' >"$PATCH"

if git apply --3way "$PATCH"; then
  echo "Applied upstream ${FROM:0:7}..${TO:0:7} cleanly."
elif git apply --reject --whitespace=nowarn "$PATCH"; then
  echo "Applied upstream ${FROM:0:7}..${TO:0:7}."
else
  echo "Some hunks did not apply: fix the *.rej files next to them, then delete the .rej files."
fi

echo "$TO" >.upstream-commit

cat <<'EOF'

Next:
  1. grep -rn "fe_core\|@axa-fr" src package.json   -> must be empty (see README)
  2. New request({ method, path }) in src/hooks/      -> add a route in src/data/mock_api.ts
  3. npm install && npm run build
EOF
