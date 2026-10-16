---
'@paso4/cloudflare-unified-billing': patch
---

Migrate the plugin to OpenClaw 2026.10.4. Bumps the global version,
`minOpenclawVersion`, and the ClawHub `compat`/`build`/`install` metadata to
2026.10.4.

OpenClaw 2026.10.4 is a maintenance release and requires no plugin-sdk,
manifest, or runtime changes for this plugin. The plugin imports only
`plugin-sdk/plugin-entry`, `plugin-sdk/core`, `plugin-sdk/provider-auth`,
`plugin-sdk/string-coerce-runtime`, and `plugin-sdk/runtime-env` — none of the
surfaces the 2026.10.x releases changed.

Also reflows `openclaw.plugin.json` back to the repository's oxfmt formatting
(the v2026.10.2 release commit wrote the manifest with expanded arrays, which
failed `format:check`).
