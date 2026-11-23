---
'@paso4/cloudflare-unified-billing': patch
---

Migrate to OpenClaw 2026.11.6.

Bump `catalog.openclaw` to `^2026.11.6` and sync the global version, the plugin
`version`, `openclaw.minOpenclawVersion`, the `openclaw.plugin.json` version, and
the ClawHub compat/build/install metadata via `bun run sync:versions`.

The tracked range (2026.11.4 → 2026.11.6) contains no breaking changes to this
plugin's surface. It imports only `plugin-sdk/plugin-entry`, `plugin-sdk/core`,
`plugin-sdk/provider-auth`, `plugin-sdk/string-coerce-runtime`, and
`plugin-sdk/runtime-env` — none of which moved. The only plugin-SDK surface
removed in the range is the A2UI custom widget-renderer hook (2026.11.4), which
this provider plugin does not use. No source, manifest, or test changes were
required for the migration; `bun run verify` and `bun run build` are green
against 2026.11.6.

2026.11.6 is a patch release (386 PRs) with no new configuration options and no
new model-provider catalogs, so `src/models.ts` is unchanged. The version is
pinned to 2026.11.6 rather than 2026.11.7 (published 2026-11-23) because 2026.11.7
carries three breaking plugin-SDK changes (session-controller
`setActiveEmbeddedRun` registration, `chatAbortControllers` /
`chatQueuedTurns` → `dispatchGatewayMethod`, and
`AgentTurnStartOwner.observe()` `expiresAtMs` → `startDeadlineAtMs`) that are
tracked as a separate migration.

The Node engine floor is unchanged since 2026.10.10
(`>=24.16.0 <25 || >=26.1.0`), which the plugin's test workflow (Node 24.22.1)
satisfies.
