---
'@paso4/cloudflare-unified-billing': patch
---

Reduce gateway log verbosity and stop logging credential values. Per-model
`normalizeResolvedModel` / `resolveDynamicModel`, catalog-provider, onboard,
and stream-wrapper diagnostics move from `info`/`warn` to `debug` so a boot
with 155 models no longer spams ~1000 info lines. All header logging goes
through a redactor covering `Authorization`, `cf-aig-authorization`,
`cf-access-*`, `api-key`, `token`, `secret`, and `client-id`; onboard and
stream-wrapper logs now record credential presence instead of values.
