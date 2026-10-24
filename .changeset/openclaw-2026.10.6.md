---
'@paso4/cloudflare-unified-billing': patch
---

Migrate the plugin to OpenClaw 2026.10.6. Bumps the global version,
`minOpenclawVersion`, and the ClawHub `compat`/`build`/`install` metadata to
2026.10.6.

OpenClaw 2026.10.6 is a security patch release (eMudhra certificate remediation,
Windows setup and Discord command fixes, iPhone Talk fixes) with no breaking
changes to this plugin's surface. The plugin imports only
`plugin-sdk/plugin-entry`, `plugin-sdk/core`, `plugin-sdk/provider-auth`,
`plugin-sdk/string-coerce-runtime`, and `plugin-sdk/runtime-env` — none of the
surfaces the 2026.10.x releases changed. No source, manifest, or test changes
were required.

The release raises the OpenClaw Node engine floor to `>=24.22.1 <25 || >=26.12.1`;
hosts that manage Node themselves must upgrade before starting OpenClaw.
