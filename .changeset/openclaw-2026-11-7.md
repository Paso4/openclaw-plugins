---
'@paso4/cloudflare-unified-billing': patch
---

Migrate to OpenClaw 2026.11.7 (session-controller SDK cutover).

Bump `catalog.openclaw` to `^2026.11.7` and sync the global version, the plugin
`version`, `openclaw.minOpenclawVersion`, the `openclaw.plugin.json` version, and
the ClawHub compat/build/install metadata via `bun run sync:versions`.

2026.11.7 contains three **breaking Plugin SDK changes with no compatibility
alias** (approved exception, see `docs/plugins/sdk-migration.md`):

1. **Session-keyed harness registration** — `setActiveEmbeddedRun(...)` now
   requires a host-admitted `runAttempt`; unadmitted calls throw
   `AgentHarnessPreflightError` / `SESSION_CONTROLLER_ADMISSION_REQUIRED`.
2. **Gateway session control** — `GatewayRequestHandlerOptions.context` no
   longer exposes the mutable `chatAbortControllers` / `chatQueuedTurns` maps
   (`PLUGIN_CAPABILITY_REMOVED`). Handlers must declare
   `contracts.gatewayMethodDispatch: ["authenticated-request"]` and dispatch via
   `dispatchGatewayMethod` from `openclaw/plugin-sdk/gateway-method-runtime`.
3. **Agent turn start observation** — `AgentTurnStartOwner.observe()` returns
   `startDeadlineAtMs`; the old `expiresAtMs` property is removed.

None applies to this plugin: it registers a model provider, its catalog, auth
methods and stream wrappers only — no agent harness, no Gateway RPC methods, and
no turn-start observation. Its manifest `contracts` stay limited to the
web-search, web-fetch and image-generation providers, so no manifest change is
required. `src/sdk-cutover.test.ts` pins that boundary: it fails if any shipped
source reintroduces one of the removed surfaces or if a
`gatewayMethodDispatch` contract appears without a dispatch import.

No model catalog change (2026.11.7 ships no provider or model changes for this
provider), so `src/models.ts` is untouched. `bun run verify` and `bun run build`
are green against 2026.11.7.
