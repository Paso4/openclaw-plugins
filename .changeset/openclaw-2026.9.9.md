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

Expands the catalog further with the Cloudflare catalog's new text-generation
author Unbiased (`unbiased/pareto`) plus 13 additional Workers AI `@cf/*`
text-generation models (GLM 5.3 / 4.7 Flash, Apertus, EuroLLM, Gemma LoRA /
SEA-LION, Granite, DeepSeek R1 Distill Qwen, and Llama 2 / 3.1 / 3.2 variants).
The `unbiased/` prefix is added to `modelSupport.modelPrefixes`; the Workers AI
entries keep the zero cost block used by the existing `workers-ai` models. Only
OpenAI chat-completions-compatible models are listed — the Cloudflare catalog's
non-chat models (Thinking Machines Inkling, TypeSafe Jev, and the
`@cf/cloudflare/clef` decision models) are intentionally excluded because this
plugin invokes every model through `/chat/completions`.
