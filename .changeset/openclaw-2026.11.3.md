---
'@paso4/cloudflare-unified-billing': patch
---

Migrate to OpenClaw 2026.11.3 and add Gemini 4 Argon to the catalog.

Bump `catalog.openclaw` to `^2026.11.3` and sync the global version, the plugin
`version`, `openclaw.minOpenclawVersion`, the `openclaw.plugin.json` version, and
the ClawHub compat/build/install metadata via `bun run sync:versions`.

The tracked range (2026.10.9 → 2026.11.3: 2026.10.10, 2026.11.1, 2026.11.2,
2026.11.3) contains no breaking changes to this plugin's surface. It imports
only `plugin-sdk/plugin-entry`, `plugin-sdk/core`, `plugin-sdk/provider-auth`,
`plugin-sdk/string-coerce-runtime`, and `plugin-sdk/runtime-env` — none of which
moved. 2026.11.3's release notes state "No new configuration options or
features". No source, manifest, or test changes were required for the migration;
`bun run verify` and `bun run build` are green against 2026.11.3.

The Node engine floor moved: OpenClaw 2026.10.10 lowered it from
`>=24.22.1 <25 || >=26.12.1` to `>=24.16.0 <25 || >=26.1.0`, which the
plugin's test workflow (Node 24.22.1) already satisfies.

Model catalog: add **Gemini 4 Argon** (`google/gemini-4-argon`), the first
Gemini 4 model, now available through the Cloudflare AI Gateway catalog and
selectable in OpenClaw 2026.10.10+. Metadata follows Cloudflare's published
model page ($2.00 input / $10.00 output / $0.10 cached input per 1M tokens,
1,048,576-token context) and the OpenClaw provider catalog for the 65,536-token
output bound and reasoning/vision capability. `src/models.test.ts` pins the
entry.
