#!/usr/bin/env bash
#
# openclaw-migrate.sh <to>
#
# Orchestrates the OpenClaw migration gate:
#   1. Resolve current + target version from package.json catalog.
#   2. Inventory the OpenClaw integration surface.
#   3. Fetch upstream release notes + configuration reference (breaking changes).
#   4. Run the deterministic verification gate.
#   5. Print PR guidance.
#
# Exit codes: 0 = gate green, 1 = a verification step failed, 2 = usage error.
#
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"
SKILL_DIR="$REPO_ROOT/skills/openclaw-migration/scripts"

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <to>"
  echo "  e.g. $0 2026.9.6"
  exit 2
fi
TO="$1"

FROM="$(bun scripts/openclaw-version.mjs)"
echo "== OpenClaw migration: $FROM -> $TO =="
echo

echo "== 1. Integration surface inventory =="
bash "$SKILL_DIR/openclaw-surface-inventory.sh"
echo

echo "== 2. Upstream breaking-change candidates =="
bash "$SKILL_DIR/openclaw-fetch-notes.sh" "$FROM" "$TO"
echo

echo "== 3. Verification gate =="
FAILED=0

run() {
  echo ">>> $*"
  if ! "$@"; then
    echo "!!! FAILED: $*"
    FAILED=1
  fi
}

run bun run format:check
run bun run lint
run bun run verify:versions
run bun run typecheck
run bun run test

if [ "$FAILED" -ne 0 ]; then
  echo
  echo "== Migration gate FAILED =="
  exit 1
fi

echo
echo "== 4. PR guidance =="
echo "branch: chore/openclaw-${TO}"
echo "commit: chore(openclaw): migrate to ${TO}"
echo "bump:   package.json catalog.openclaw = ^${TO}"
echo "        then: bun run sync:versions && bun install"
echo "target: develop"
