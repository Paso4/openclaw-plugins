---
'@paso4/cloudflare-unified-billing': patch
---

Migrate the plugin to OpenClaw 2026.10.5. Bumps the global version,
`minOpenclawVersion`, and the ClawHub `compat`/`build`/`install` metadata to
2026.10.5.

OpenClaw 2026.10.5 is a feature release (refreshed sidebar, Skill Workshop 2.0,
public conversation links) with no breaking changes to this plugin's surface.
The plugin imports only `plugin-sdk/plugin-entry`, `plugin-sdk/core`,
`plugin-sdk/provider-auth`, `plugin-sdk/string-coerce-runtime`, and
`plugin-sdk/runtime-env` — none of the surfaces the 2026.10.x releases changed.
No source, manifest, or test changes were required.
