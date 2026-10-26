---
'@paso4/cloudflare-unified-billing': patch
---

Migrate to OpenClaw 2026.10.7.

Bump `catalog.openclaw` to `^2026.10.7` and sync the global version, the plugin
`version`, `openclaw.minOpenclawVersion`, the `openclaw.plugin.json` version,
and the ClawHub compat/build/install metadata via `bun run sync:versions`.

2026.10.7 is a patch release (updates/recovery, lost-reply and
conversation-context repairs, provider fixes, Bun startup DB check) with no
breaking changes to this plugin's surface. It imports only
`plugin-sdk/plugin-entry`, `plugin-sdk/core`, `plugin-sdk/provider-auth`,
`plugin-sdk/string-coerce-runtime`, and `plugin-sdk/runtime-env` — none of which
changed. No source, manifest, or test changes were required; `bun run verify`
and `bun run build` are green against 2026.10.7.

The Node engine floor is unchanged (`>=24.22.1 <25 || >=26.12.1`).
