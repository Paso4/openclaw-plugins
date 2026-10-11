---
'@paso4/cloudflare-unified-billing': patch
---

Migrate the plugin to OpenClaw 2026.10.1. Bumps the global version,
`minOpenclawVersion`, and the ClawHub `compat`/`build`/`install` metadata to
2026.10.1.

OpenClaw 2026.10.1 retires several plugin-sdk subpaths
(`channel-lifecycle`, `channel-message`, `channel-reply-pipeline`,
`config-runtime`, `infra-runtime`, `command-auth`, `discord`,
`telegram-account`) and removes the whole-store/transcript-file SDK bridges.
This plugin imports only `plugin-sdk/plugin-entry`, `plugin-sdk/core`,
`plugin-sdk/provider-auth`, `plugin-sdk/string-coerce-runtime`, and
`plugin-sdk/runtime-env` — none of the retired surfaces — so no source,
manifest, or runtime changes are required.
