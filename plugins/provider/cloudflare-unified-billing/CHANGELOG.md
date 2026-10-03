# @paso4/cloudflare-unified-billing

## 2026.9.8

### Patch Changes

- Migrate the plugin to OpenClaw 2026.9.8. Bumps the global version,
  `minOpenclawVersion`, and the ClawHub `compat`/`build`/`install` metadata to
  2026.9.8. The 2026.9.8 release requires no plugin-sdk, manifest, or runtime
  changes for this plugin.

## 2026.9.6-2

### Patch Changes

- 0795f94: Reduce gateway log verbosity and stop logging credential values. Per-model
  `normalizeResolvedModel` / `resolveDynamicModel`, catalog-provider, onboard,
  and stream-wrapper diagnostics move from `info`/`warn` to `debug` so a boot
  with 155 models no longer spams ~1000 info lines. All header logging goes
  through a redactor covering `Authorization`, `cf-aig-authorization`,
  `cf-access-*`, `api-key`, `token`, `secret`, and `client-id`; onboard and
  stream-wrapper logs now record credential presence instead of values.

## 2026.9.6

### Patch Changes

- 8eceb22: Initial public import of the Cloudflare Unified Billing provider plugin:
  full Cloudflare AI Gateway model catalog, unified billing support, web
  search/fetch and image-generation capabilities, and the Cloudflare Access /
  custom-domain auth paths.
