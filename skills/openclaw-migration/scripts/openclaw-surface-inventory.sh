#!/usr/bin/env bash
#
# openclaw-surface-inventory.sh
#
# Inventory every OpenClaw-linked touchpoint in the plugins monorepo so a
# migration agent can map upstream breaking changes to concrete code.
#
# Emits three sections:
#   1. plugin-sdk imports   — `openclaw/plugin-sdk/*` (rename/move between releases)
#   2. CLI invocations      — `openclaw <command>` (added/removed/renamed commands)
#   3. manifest surfaces    — keys plugins declare in openclaw.plugin.json
#
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"

echo "== plugin-sdk imports =="
grep -rn --include="*.ts" --include="*.tsx" \
  "from ['\"]openclaw/plugin-sdk" plugins \
  2>/dev/null \
  | grep -v node_modules \
  | grep -v '/dist/' \
  | sed -E "s|^([^:]+):([0-9]+):.*from ['\"]([^'\"]+)['\"].*|\1:\2 -> \3|" \
  | sort -u

echo
echo "== CLI invocations (openclaw <command>) =="
grep -rnoE "openclaw [a-z][a-z-]*" plugins \
  2>/dev/null \
  | grep -v node_modules \
  | grep -v '/dist/' \
  | sed -E "s/.*openclaw (.*)/\1/" \
  | sort | uniq -c | sort -rn

echo
echo "== manifest surfaces (openclaw.plugin.json keys) =="
find plugins -name 'openclaw.plugin.json' -not -path '*/node_modules/*' -print0 \
  | xargs -0 -I{} sh -c 'echo "--- {}"; grep -oE "\"[A-Za-z0-9_]+\":" "{}" | tr -d "\":" | sort -u'
