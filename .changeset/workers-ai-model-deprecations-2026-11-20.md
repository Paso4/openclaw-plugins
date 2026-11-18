---
'@paso4/cloudflare-unified-billing': patch
---

Drop the Workers AI models Cloudflare retires on 2026-11-20 and add the
recommended replacements.

Cloudflare's [planned model deprecations](https://developers.cloudflare.com/changelog/post/2026-11-05-planned-model-deprecations/)
retire 24 Workers AI models on 2026-11-20; requests then fail with HTTP `410`
and error `5028`. The catalog no longer advertises the eleven retired models it
carried:

- `@cf/moonshotai/kimi-k2.6`, `@cf/moonshotai/kimi-k2.7-code`
- `@cf/zai-org/glm-5.2`, `@cf/zai-org/glm-5.3-flash`
- `@cf/deepseek-ai/deepseek-v4-pro-0813`,
  `@cf/deepseek-ai/deepseek-v4-flash-0731`,
  `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`
- `@cf/meta-llama/llama-2-7b-chat-hf-lora`
- `@cf/google/gemma-2b-it-lora`, `@cf/google/gemma-7b-it-lora`
- `@cf/meta/llama-3.1-8b-instruct-fp8`

The deprecated enum values stay in `CloudflareUnifiedBillingModel` so existing
model refs remain source-compatible, but they are excluded from `ALL_MODELS`.

Adds the recommended replacements (Workers AI unit pricing is billed per
neuron, so they keep the zero cost block; max output is not published on the
model pages, so the plugin default of 4096 is used):

- `@cf/deepseek-ai/deepseek-v4.1-flash-1017` (1,048,576-token context,
  reasoning + vision)
- `@cf/google/gemma-4-26b-a4b-it` (256,000-token context, reasoning + vision)
- `@cf/qwen/qwen3.8-27b` (262,144-token context, reasoning + vision)

`@cf/zai-org/glm-5.3` (the replacement for GLM 5.2 / GLM 5.3 Flash) was already
in the catalog. `src/registration.test.ts` pins both the retired list and the
replacements.
