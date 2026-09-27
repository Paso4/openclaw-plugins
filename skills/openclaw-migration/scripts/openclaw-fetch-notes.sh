#!/usr/bin/env bash
#
# openclaw-fetch-notes.sh <from> <to>
#
# Fetch the upstream OpenClaw release notes + Configuration reference and
# extract candidate breaking changes, so a migration agent has the raw,
# deterministic signal without reading 2 MB of release prose.
#
# Sources:
#   - https://docs.openclaw.ai/releases/<to>.md
#   - https://docs.openclaw.ai/gateway/configuration-reference.md
#   - node_modules/openclaw/CHANGELOG.md (when present)
#
# Output: a markdown list of lines mentioning break keywords.
#
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

if [ "$#" -lt 2 ]; then
  echo "usage: $0 <from> <to>"
  echo "  e.g. $0 2026.7.1-2 2026.8.2"
  exit 2
fi

FROM="$1"
TO="$2"
WORK="${TMPDIR:-/tmp}/openclaw-notes-${TO}"
mkdir -p "$WORK"

# Break keywords: retired/removed/no longer/deprecated/gone/renamed/breaking
BREAK_RE="(retired|removed|no longer|deprecated|gone without|renamed|breaking|compatibility window)"

echo "# OpenClaw breaking-change candidates: $FROM -> $TO"
echo

fetch_md() {
  local url="$1" out="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$out" 2>/dev/null
  else
    echo "curl not found; cannot fetch $url" >&2
  fi
}

RELEASE="$WORK/release.md"
fetch_md "https://docs.openclaw.ai/releases/${TO}.md" "$RELEASE"
if [ -s "$RELEASE" ]; then
  echo "## From release notes (${TO})"
  echo
  grep -inE "$BREAK_RE" "$RELEASE" \
    | grep -vE "^\s*[-*] .*\[#[0-9]+\]\(https://github.com/openclaw/openclaw/pull/[0-9]+\)" \
    | sed -E "s/^([0-9]+):/\1: /" \
    | head -80
  echo
else
  echo "## From release notes: (not fetched)"
  echo
fi

CONF="$WORK/config-reference.md"
fetch_md "https://docs.openclaw.ai/gateway/configuration-reference.md" "$CONF"
if [ -s "$CONF" ]; then
  echo "## From configuration reference (deterministic schema truth)"
  echo
  grep -inE "$BREAK_RE" "$CONF" \
    | sed -E "s/^([0-9]+):/\1: /" \
    | head -80
  echo
fi

CHANGELOG="$REPO_ROOT/node_modules/openclaw/CHANGELOG.md"
if [ -f "$CHANGELOG" ]; then
  echo "## From installed openclaw CHANGELOG.md"
  echo
  grep -inE "$BREAK_RE" "$CHANGELOG" | head -40
  echo
fi

echo "## Raw files"
echo "  $RELEASE"
echo "  $CONF"