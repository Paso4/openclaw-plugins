---
'@paso4/cloudflare-unified-billing': patch
---

Reword the README credential documentation so the Cloudflare Access header is
described as prose instead of an inline `key: <placeholder>` pair. The previous
wording (`cf-access-token: <CF_ACCESS_TOKEN>`) tripped the ClawHub security
audit's secret scanner (`suspicious.exposed_secret_literal`), which misread the
documented header format as a hardcoded token.
