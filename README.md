# Paso4 OpenClaw Plugins

A monorepo of reusable [OpenClaw](https://docs.openclaw.ai/) plugins, published
on [ClawHub](https://clawhub.ai/) so they can be installed across environments
with a single command. Plugins are built and versioned here, then consumed by
OpenClaw gateways.

## About Paso4

Paso4 builds managed agent infrastructure on top of OpenClaw. We maintain this
repository as the public home for the plugins we run in production, so the wider
OpenClaw community can install the same building blocks. The plugins are free
for non-commercial use; commercial use is limited to vendors and partners that
Paso4 has authorized in writing. See [LICENSE](./LICENSE).

## Coming from ClawHub?

ClawHub lists plugins by package. This repository is the source of truth for the
Paso4-published ones. The folder layout mirrors the
[OpenClaw plugin shapes](https://docs.openclaw.ai/plugins/building-plugins#choose-the-plugin-shape),
so you can find a plugin by the kind of capability it adds:

| OpenClaw plugin shape | Directory              | What lives here                                             |
| --------------------- | ---------------------- | ----------------------------------------------------------- |
| Provider plugin       | `plugins/provider/`    | Model, media, search, fetch, speech, and realtime providers |
| Channel plugin        | `plugins/channel/`     | Messaging-platform integrations                             |
| Tool plugin           | `plugins/tool/`        | Agent tools and output contracts                            |
| CLI backend plugin    | `plugins/cli-backend/` | Local AI CLI backends exposed through model fallback        |
| Feature plugin        | `plugins/feature/`     | Typed operations, native pages, Control UI replacements     |

A plugin therefore lives at `plugins/<shape>/<plugin-name>/`.

### Published plugins

| Plugin                                                                       | Shape    | ClawHub package                     |
| ---------------------------------------------------------------------------- | -------- | ----------------------------------- |
| [cloudflare-unified-billing](./plugins/provider/cloudflare-unified-billing/) | Provider | `@paso4/cloudflare-unified-billing` |

## Install a plugin

Install through ClawHub (recommended):

```bash
openclaw plugins install clawhub:@paso4/cloudflare-unified-billing
openclaw plugins inspect cloudflare-unified-billing --runtime --json
```

Or from a local checkout while developing:

```bash
bun run --cwd plugins/provider/cloudflare-unified-billing build
openclaw plugins install "$PWD/plugins/provider/cloudflare-unified-billing" --force --accept-capabilities
```

## Development

Requirements: [Bun](https://bun.sh/) 1.3+, Node 24+ (the OpenClaw runtime), and
the `openclaw` CLI when running live integration tests.

```bash
bun install                 # install workspaces
bun run list:plugins        # list discovered plugins and their versions
bun run build               # build every plugin
bun run test                # unit tests for every plugin
bun run typecheck           # tsc --noEmit per plugin
bun run verify              # format + lint + version policy + typecheck + tests
```

To work on one plugin:

```bash
bun run --cwd plugins/provider/cloudflare-unified-billing test
bun run --cwd plugins/provider/cloudflare-unified-billing test:watch
```

### Live integration tests

Integration tests make **real, paid** calls to providers and are gated behind
an explicit opt-in. They never run on pull requests.

```bash
cd plugins/provider/cloudflare-unified-billing
cp .dev.vars.example .dev.vars   # fill in Cloudflare AI Gateway credentials
PLUGIN_LIVE_TESTS=true bun run test:integration
```

The `develop` CI job sets `PLUGIN_LIVE_TESTS=true` and passes credentials from
repository secrets. Everywhere else the suite skips itself.

## Versioning policy

The repository ships **one global version**. Its base always matches the
compatible OpenClaw version declared in the root `package.json` →
`catalog.openclaw`:

```
catalog.openclaw = "^2026.9.6"   →   global version base = 2026.9.6
```

[Changesets](https://changesets.dev/) records change intent: every change to a
plugin must include a `.changeset/*.md` entry. On release, `bun run version`
consumes the changesets into each plugin's `CHANGELOG.md` and then
`scripts/sync-versions.mjs` stamps the global version onto:

- every plugin `package.json` → `version`
- every plugin `package.json` → `openclaw.minOpenclawVersion`
- every plugin `openclaw.plugin.json` → `version`

`bun run verify:versions` fails if any of those drift. When OpenClaw is bumped,
update `catalog.openclaw` and run `bun run sync:versions` — the version and the
compatibility declaration move together.

Multiple releases can ship against the same OpenClaw version by appending a
build suffix (`2026.9.6-2`); `scripts/resolve-release-version.mjs` computes it
from existing tags.

## CI/CD

| Workflow                                         | Trigger                  | What it does                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`test.yml`](./.github/workflows/test.yml)       | push / PR to `develop`   | Detects changed plugins, runs each plugin's unit suite, and runs live integration tests (with secrets) only on `develop` pushes.                                                                       |
| [`release.yml`](./.github/workflows/release.yml) | manual dispatch          | Applies changesets, stamps the global version, commits, tags `v<version>`, and creates the GitHub Release.                                                                                             |
| [`publish.yml`](./.github/workflows/publish.yml) | GitHub Release published | Builds and packs each plugin (`dist/` is not committed), then validates and publishes the ClawPack with the upstream `openclaw/clawhub` reusable workflow. Also runs as a `workflow_dispatch` dry-run. |

Required repository secrets: `CLAWHUB_TOKEN` (ClawHub publish), `RELEASE_PAT`
(a PAT so the release event can trigger `publish.yml`), and the AI Gateway
credentials used by live tests. Without `CLAWHUB_TOKEN`, publish runs are
limited to dry-runs.

## Contributing

1. Add or update a plugin under `plugins/<shape>/<name>/`.
2. Keep unit tests colocated (`src/*.test.ts`) and live tests under
   `tests/integration/`.
3. Add a changeset: `bun run changeset`.
4. Run `bun run verify` and open a PR against `develop`.

Agent guidance lives in [AGENTS.md](./AGENTS.md). The OpenClaw migration
playbook is available as a skill at
[`skills/openclaw-migration`](./skills/openclaw-migration/) and is driven by the
`openclaw-updater` agent.

## License

Source-available under the [Paso4 Open Plugin License](./LICENSE): free for
non-commercial use, with commercial use reserved for Paso4-authorized vendors.
