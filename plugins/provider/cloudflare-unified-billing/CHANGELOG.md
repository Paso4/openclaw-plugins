# @paso4/cloudflare-unified-billing

## 2026.9.9

### Patch Changes

- 4a05512: Reword the README credential documentation so the Cloudflare Access header is
  described as prose instead of an inline `key: <placeholder>` pair. The previous
  wording (`cf-access-token: <CF_ACCESS_TOKEN>`) tripped the ClawHub security
  audit's secret scanner (`suspicious.exposed_secret_literal`), which misread the
  documented header format as a hardcoded token.
- 4e8f82c: Migrate the plugin to OpenClaw 2026.9.9. Bumps the global version,
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

## 2026.9.9

### Patch Changes

- 60adefb: Migrate the plugin to OpenClaw 2026.9.8. Bumps the global version,
  `minOpenclawVersion`, and the ClawHub `compat`/`build`/`install` metadata to
  2026.9.8. The 2026.9.8 release requires no plugin-sdk, manifest, or runtime
  changes for this plugin.

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
