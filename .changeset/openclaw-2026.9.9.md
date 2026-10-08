---
'@paso4/cloudflare-unified-billing': patch
---

Migrate the plugin to OpenClaw 2026.9.9. Bumps the global version,
`minOpenclawVersion`, and the ClawHub `compat`/`build`/`install` metadata to
2026.9.9. OpenClaw 2026.9.9 requires no plugin-sdk, manifest, or runtime changes
for this plugin: it ships a managed-Codex reliability hotfix, the already
advertised GPT-6.1 Sol model, and Windows/update fixes.

Also refreshes the unified-billing catalog against the Cloudflare AI model
catalog: adds `openai/gpt-6.1-sol` (enabled by 2026.9.9) and
`anthropic/claude-sonnet-5.5`, and aligns the Anthropic REST model ids with the
Cloudflare catalog's dot form (for example `anthropic/claude-sonnet-4.6`
instead of `anthropic/claude-sonnet-4-6`).
