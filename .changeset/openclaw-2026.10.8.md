---
'@paso4/cloudflare-unified-billing': patch
---

Migrate to OpenClaw 2026.10.8.

Bump `catalog.openclaw` to `^2026.10.8` and sync the global version, the plugin
`version`, `openclaw.minOpenclawVersion`, the `openclaw.plugin.json` version,
and the ClawHub compat/build/install metadata via `bun run sync:versions`.

2026.10.8 is a bug-fix/security release with no breaking changes to this
plugin's surface. It imports only `plugin-sdk/plugin-entry`, `plugin-sdk/core`,
`plugin-sdk/provider-auth`, `plugin-sdk/string-coerce-runtime`, and
`plugin-sdk/runtime-env` — none of which changed. No source, manifest, or test
changes were required; `bun run verify` and `bun run build` are green against
2026.10.8.

Relevant upstream fixes for a gateway running this provider: plugin lifecycle
repairs (older plugins process incoming messages again after an upgrade, and
scheduled plugin work no longer stops after startup or reload), prompt handling
of oversized model-provider responses (the streaming error is reported instead
of leaving the request waiting), and Gemini/Vertex requests no longer wait after
a compatible proxy signals the end of a response — the Cloudflare AI Gateway
REST transport in this plugin is exactly such a proxy.

The model catalog is unchanged: 2026.10.8 added no models, and the release's
"Models and Providers" section contains provider bug fixes only. The Node engine
floor is unchanged (`>=24.22.1 <25 || >=26.12.1`).
