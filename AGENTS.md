# Agent Instructions — Paso4 OpenClaw Plugins

Public monorepo of reusable OpenClaw plugins published on ClawHub. Read
[README.md](./README.md) first.

## Layout

```
plugins/<shape>/<plugin-name>/     # shape ∈ channel | provider | cli-backend | tool | feature
  src/                             # plugin source + colocated unit tests (*.test.ts)
  tests/integration/               # live, paid tests (gated by PLUGIN_LIVE_TESTS)
  openclaw.plugin.json             # OpenClaw manifest
  package.json                     # version follows the repo global version
  tsconfig.json                    # extends the root tsconfig
scripts/                           # version + CI helper scripts (run with bun)
skills/openclaw-migration/         # deterministic OpenClaw migration playbook
.changeset/                        # changesets for change intent
.github/workflows/                 # test (develop) · release (manual) · publish (release)
```

## Non-negotiables

- **Never commit secrets.** `.dev.vars`, `.env*`, and live credentials stay out
  of git. Use `.dev.vars.example` for documentation.
- **One global version.** The base of the root `package.json` `version` MUST
  equal the compatible OpenClaw version in root `catalog.openclaw`. Every plugin
  `package.json` `version`, `openclaw.plugin.json` `version`, and
  `openclaw.minOpenclawVersion` must follow it. Enforce with
  `bun run verify:versions`; align with `bun run sync:versions`.
- **Changesets.** Every plugin change needs a `.changeset/*.md` entry
  (`bun run changeset`).
- **Live tests are opt-in.** Integration tests spend real credits and only run
  when `PLUGIN_LIVE_TESTS=true`. Never enable them on pull requests.
- **Do not hardcode the OpenClaw version** in a workflow, plugin, or script.
  Derive it from `package.json` → `catalog.openclaw` via
  `bun scripts/openclaw-version.mjs`.

## Commands

```bash
bun install
bun run list:plugins
bun run build
bun run test
bun run test:integration     # skips unless PLUGIN_LIVE_TESTS=true
bun run typecheck
bun run verify:versions
bun run sync:versions
bun run verify               # format:check + lint + verify:versions + typecheck + test
```

## Adding a plugin

1. Pick the directory from the OpenClaw shape: `plugins/<shape>/<name>/`.
2. Add `package.json` (`"openclaw": { "plugin": true, ... }`), an
   `openclaw.plugin.json` manifest, `src/`, tests, and a `tsconfig.json` that
   extends the root.
3. Set the version by running `bun run sync:versions`.
4. Add a changeset and open a PR against `develop`.

## OpenClaw migrations

When OpenClaw releases a new version, use the `openclaw-migration` skill
(`skills/openclaw-migration/SKILL.md`) or run:

```bash
bash skills/openclaw-migration/scripts/openclaw-migrate.sh <target-version>
```

Then bump `catalog.openclaw`, run `bun run sync:versions`, and verify with
`bun run verify`. The `openclaw-updater` agent wraps this workflow; its
definition lives in [`.github/agents/openclaw-updater.md`](./.github/agents/openclaw-updater.md).

## CI/CD

- `test.yml` runs on pushes/PRs to `develop`; only changed plugins run. Live
  integration tests run only on `develop` pushes with credentials present.
- `release.yml` (manual) applies changesets, stamps the global version, tags
  `v<version>`, creates the GitHub Release, and dispatches `publish.yml`.
- `publish.yml` (dispatched by `release.yml`, or `workflow_dispatch` for
  dry-runs) resolves the plugins affected by the release from its consumed
  changesets (`bun scripts/affected-plugins.mjs --base HEAD^`; the `plugin`
  input overrides): it builds + packs each affected plugin into an npm tarball
  and hands it to `openclaw/clawhub`'s reusable `package-publish.yml`, since the
  ClawHub publisher does not run build scripts. `dist/` is never committed.
