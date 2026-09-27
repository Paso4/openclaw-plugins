---
name: openclaw-migration
description: >
  Migrate the Paso4 OpenClaw plugins monorepo to a new OpenClaw release. Uses
  deterministic tools to inventory every OpenClaw-linked surface (plugin-sdk
  imports, CLI invocations, manifest/config keys), cross-reference the upstream
  release notes and Configuration reference for breaking changes, apply fixes,
  run the verification gate, and open a PR. Works for opencode and pi agents.
---

# OpenClaw Migration

When OpenClaw bumps releases, the plugins in this repository must follow. This
skill turns that into a deterministic, repeatable workflow so an agent (opencode
or pi) can migrate without guessing.

## Single source of truth for the version

The compatible OpenClaw version lives in **one place**: the root `package.json`
→ `catalog.openclaw` (e.g. `"openclaw": "^2026.9.6"`). Everything derives from
it via `bun scripts/openclaw-version.mjs`:

| Consumer                                     | How it resolves                              |
| -------------------------------------------- | -------------------------------------------- |
| `.github/workflows/test.yml`                 | `bun scripts/openclaw-version.mjs`           |
| `.github/workflows/publish.yml`              | `bun scripts/openclaw-version.mjs`           |
| plugin `package.json` → `minOpenclawVersion` | `bun run sync:versions`                      |
| repo global version (root + plugins)         | base of the global version == catalog target |

**Bumping OpenClaw = editing one line in `package.json` → `catalog.openclaw`,
then `bun run sync:versions`. Never hardcode the version in a workflow or a
plugin.**

## Deterministic workflow

### 1. Inventory the integration surface

```bash
bash skills/openclaw-migration/scripts/openclaw-surface-inventory.sh
```

Prints a machine-readable map of every OpenClaw-linked touchpoint:

- `openclaw/plugin-sdk/*` imports (these rename and move between releases)
- `openclaw <command>` CLI invocations (added/removed/renamed commands)
- manifest/config keys plugins declare (`openclaw.plugin.json`, `tools.*`, etc.)

### 2. Fetch the upstream breaking changes

```bash
bash skills/openclaw-migration/scripts/openclaw-fetch-notes.sh <from> <to>
# e.g. bash skills/openclaw-migration/scripts/openclaw-fetch-notes.sh 2026.8.2 2026.9.6
```

Downloads `<to>`'s release notes + the Configuration reference (`.md`) and greps
for break keywords (`retired`, `removed`, `no longer`, `deprecated`, `gone
without`, `renamed`, `breaking`). It also checks
`node_modules/openclaw/CHANGELOG.md` when present.

### 3. Cross-reference and fix

For each candidate breaking change, map it to the inventory:

| Upstream break                                | What to change in a plugin                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/<subpath>` renamed/moved | Update the import in `src/*.ts` to the new focused subpath.                           |
| root `openclaw/plugin-sdk` export removed     | Import from `openclaw/plugin-sdk/core` instead.                                       |
| provider model/catalog types dropped          | Pin a local structural type in `src/models.ts` instead of importing the dropped type. |
| hook lifecycle renamed                        | Update the hook name in `src/index.ts` and its tests.                                 |
| manifest contract field added/renamed         | Update `openclaw.plugin.json` (and `package.json` `openclaw.*` metadata).             |
| install-time capability consent required      | Keep `--accept-capabilities` in integration test/install flows.                       |

Then update tests that asserted the old behavior and add coverage for the new
behavior.

### 4. Update the version

```bash
# 1. Edit package.json -> catalog.openclaw to "^<target>"
# 2. Apply the global version everywhere
bun run sync:versions
bun install
```

`bun install` (re)installs the OpenClaw runtime — a fast smoke test that the
plugin-sdk surface still resolves.

### 5. Verify

```bash
bun run verify   # format:check + lint + verify:versions + typecheck + test
```

Live integration tests are opt-in and spend real credits (develop CI only):

```bash
# only when intentionally spending credits
PLUGIN_LIVE_TESTS=true bun run --cwd plugins/provider/cloudflare-unified-billing test:integration
```

### 6. Open the PR

```bash
git checkout -b chore/openclaw-<target>
git add -A
git commit -m "chore(openclaw): migrate to <target>"
gh pr create --title "Migrate OpenClaw to <target>" --body-file /tmp/openclaw-pr-body.md
```

Target `develop`. The PR body should contain a table of the plugin surface and
every breaking change applied, plus the verification results.

## Verification that the migration is real

- `bun run build` succeeds (plugin-sdk imports resolve).
- `bun run test` is green and `bun run typecheck` reports no errors.
- `bun run verify:versions` confirms the global version base matches the new
  OpenClaw version.
- Live integration tests pass when run intentionally (`PLUGIN_LIVE_TESTS=true`).
