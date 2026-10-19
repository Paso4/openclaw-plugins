---
'@paso4/cloudflare-unified-billing': patch
---

Migrate the plugin to the OpenClaw awaited auth-profile APIs for the
`auth-profile-sync-operations` deprecation (final compatibility day
2026-12-31; removal in the first January 2027 stable release).

- Catalog preparation now awaits `loadAuthProfileStoreForRuntimeAsync` from
  `openclaw/plugin-sdk/agent-runtime` with `readOnly: true` and
  `allowKeychainPrompt: false`, so the profile-store read runs on the auth
  owner's database worker instead of synchronously on the Gateway thread.
- The image generation provider implements `isConfiguredAsync`
  (`ImageGenerationProvider.isConfigured` -> `isConfiguredAsync`) alongside the
  released synchronous `isConfigured` hook. `normalizeResolvedModel` is a
  released synchronous host resolver, so it keeps its synchronous callback
  through the 2026-12-31 window.

Bumps the global version, `minOpenclawVersion`, and the ClawHub
`compat`/`build`/`install` metadata to 2026.10.10, targeting OpenClaw
`2026.10.10-beta.1`, which ships the awaited replacements. Adds `openclaw` as a
root development dependency so the new target is installed and linked, and
teaches `verify:versions` to compare the compatibility base of a prerelease
`catalog.openclaw` target.
