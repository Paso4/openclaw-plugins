---
'@paso4/cloudflare-unified-billing': patch
---

Ship the plugin icon at the portable `assets/icon.png` path and include
`assets/` in the published package so ClawHub can surface it as the plugin
logo. The icon is a 512×512 PNG under the 256 KB cap OpenClaw enforces when it
reads a packaged plugin icon.
