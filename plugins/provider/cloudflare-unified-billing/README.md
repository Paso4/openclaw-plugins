# @paso4/cloudflare-unified-billing

OpenClaw provider plugin for Cloudflare AI Gateway with full model catalog (150+ models) and unified billing support.

## Features

- **Full Model Catalog**: 150+ models from Google Gemini, Anthropic Claude, OpenAI, xAI Grok, DeepSeek, Alibaba Qwen, MiniMax, Moonshot Kimi, Workers AI frontier models, and more
- **Multi-API Support**: Native wire protocol for each model family
- **Unified Billing Mode**: Optional `openai-completions` compatibility layer
- **Capabilities**: Web search, web fetch, and image generation through the same gateway
- **Auto Discovery**: Installed in `~/.openclaw/plugins/`, auto-discovered by gateway

## Installation

Install through ClawHub:

```bash
openclaw plugins install clawhub:@paso4/cloudflare-unified-billing
openclaw plugins inspect cloudflare-unified-billing --runtime --json
```

### Building from source

```bash
bun install
bun run --cwd plugins/provider/cloudflare-unified-billing build
openclaw plugins install "$PWD/plugins/provider/cloudflare-unified-billing" --force --accept-capabilities
```

`bun run build` bundles `src/` into `dist/` with `openclaw` marked **external**
(`--external openclaw`). `openclaw` is a peerDependency resolved by the host
runtime — never bundle it into `dist/`. Keep the `--external openclaw` flag when
modifying the build script.

## Configuration

### Environment Variables

| Variable                        | Description                                                        |
| ------------------------------- | ------------------------------------------------------------------ |
| `CLOUDFLARE_AI_GATEWAY_API_KEY` | AI-scoped credential for the CF AI Gateway provider                |
| `CLOUDFLARE_API_TOKEN`          | Bearer token for the AI Gateway REST API                           |
| `CF_AI_GATEWAY_ACCOUNT_ID`      | Cloudflare account ID                                              |
| `CF_AI_GATEWAY_GATEWAY_ID`      | Gateway ID                                                         |
| `CF_AI_GATEWAY_CUSTOM_DOMAIN`   | Optional AI Gateway custom domain (e.g. `ai.example.com`)          |
| `CF_ACCESS_TOKEN`               | Optional Cloudflare Access user JWT for an Access-protected domain |
| `CF_ACCESS_CLIENT_ID`           | Optional Cloudflare Access service-token client ID                 |
| `CF_ACCESS_CLIENT_SECRET`       | Optional Cloudflare Access service-token client secret             |

### Onboard

The plugin uses `providerAuthAliases` to map `cloudflare-unified-billing` → `cloudflare-ai-gateway`.  
Auth profiles created via the bundled `cloudflare-ai-gateway` provider are automatically discovered.

**Recommended: Use bundled provider's auth choice** (has CLI flags for account-id/gateway-id):

```bash
openclaw onboard --non-interactive \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-api-key $API_KEY \
  --cloudflare-ai-gateway-account-id $ACCOUNT_ID \
  --cloudflare-ai-gateway-gateway-id $GATEWAY_ID
```

The plugin will discover this profile and provide the extended model catalog.

**Alternative: Use plugin's auth choice** (account-id/gateway-id from env vars only, no CLI flags):

```bash
export CF_AI_GATEWAY_ACCOUNT_ID=$ACCOUNT_ID
export CF_AI_GATEWAY_GATEWAY_ID=$GATEWAY_ID
openclaw onboard --auth-choice cloudflare-unified-billing-api-key
# API key read from CLOUDFLARE_AI_GATEWAY_API_KEY env var
```

## Model Selection

Models are referenced with the `cloudflare-unified-billing/` prefix:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "cloudflare-unified-billing/anthropic/claude-sonnet-4-6",
        "fallbacks": ["cloudflare-unified-billing/openai/gpt-4o"]
      }
    }
  }
}
```

## Unified Billing Mode

All requests use the Cloudflare AI Gateway REST API (OpenAI-compatible):

- Base URL: `https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1`
- Auth: send the `CLOUDFLARE_API_TOKEN` value as the Bearer `Authorization` header
- Gateway routing: `cf-aig-gateway-id: <gateway-id>` header (requests route through the configured gateway; if the gateway has unified-billing credits, third-party models are billed to the account)
- All models use `openai-completions` API
- Per-model API differences are stripped

This is useful when you want Cloudflare to handle billing aggregation across all providers.

> **Note**: The legacy `gateway.ai.cloudflare.com/v1/{account}/{gateway}/compat` endpoint is deprecated for single-model calls. Third-party unified billing is served through the REST API above. The configured gateway must have unified-billing credits (or BYOK provider keys) for third-party models; the account's `default` gateway typically has them.

## User Insights via custom domain

The [AI Gateway User Insights](https://developers.cloudflare.com/ai-gateway/observability/user-insights/) dashboard attributes spend to individual identities. Without an identity, all traffic is grouped under one anonymous user. To attribute spend per user, either tag requests with custom metadata or put an [Access-protected **custom domain**](https://developers.cloudflare.com/ai-gateway/configuration/cloudflare-access/) in front of the gateway.

Custom domains are **not** served by the Cloudflare REST API (`api.cloudflare.com`), so the plugin switches to the AI Gateway endpoint when `CF_AI_GATEWAY_CUSTOM_DOMAIN` is set:

- Base URL: `https://<custom-domain>/compat`
- With Access: send the `CF_ACCESS_TOKEN` value in the `cf-access-token` request header (AI Gateway records the verified Access subject as `cf.user_id`)
- Without Access: send the `CLOUDFLARE_API_TOKEN` value as the Bearer `Authorization` header

```bash
# 1. Create a custom domain on the gateway and put it behind Cloudflare Access.
# 2. Point the plugin at it:
export CF_AI_GATEWAY_CUSTOM_DOMAIN=ai.example.com

# 3a. Per-user attribution — a user Access JWT from cloudflared:
export CF_ACCESS_TOKEN="$(cloudflared access login https://ai.example.com)"

# 3b. Or headless service-token auth (no cf.user_id; stays anonymous):
export CF_ACCESS_CLIENT_ID=...
export CF_ACCESS_CLIENT_SECRET=...
```

Because every request from a tenant's agent carries the Access identity, User Insights groups spend per user without the client application passing user IDs. Service-token requests authenticate successfully but do **not** receive `cf.user_id`.

## Available Models

Models are referenced with the `cloudflare-unified-billing/` prefix followed by
the Cloudflare REST model id, e.g.
`cloudflare-unified-billing/anthropic/claude-opus-5`. The tables below list the
model id (the part after the plugin prefix).

> The catalog tracks the [Cloudflare AI model catalog](https://developers.cloudflare.com/ai/models/).
> xAI models use the `xai/` REST prefix (the native `grok/` prefix only applies
> to the `gateway.ai.cloudflare.com` endpoint, which this plugin does not use).

### Google Gemini (google)

**⚠️ Known Limitation**: Gemini models through Cloudflare's unified billing have degraded tool calling performance due to a Google API requirement. Gemini requires `thought_signature` in function calls for optimal performance, but the OpenAI compat format doesn't support this field. For full tool calling support with Gemini models, use the direct Google provider (`google` or `google-gemini-cli`) instead.

| Model                            | Context | Max Output | Tool Calling         |
| -------------------------------- | ------- | ---------- | -------------------- |
| `gemini-3.8-flash`               | 1M      | 65K        | Degraded performance |
| `gemini-3.7-flash`               | 1M      | 65K        | Degraded performance |
| `gemini-3.6-flash`               | 1M      | 65K        | Degraded performance |
| `gemini-3.5-flash`               | 1M      | 65K        | Degraded performance |
| `gemini-3.5-flash-lite`          | 1M      | 65K        | Degraded performance |
| `gemini-3.1-pro`                 | 1M      | 65K        | Degraded performance |
| `gemini-3.1-flash-lite`          | 1M      | 65K        | Degraded performance |
| `gemini-3.1-flash-image-preview` | 131K    | 32K        | Degraded performance |
| `gemini-3-flash`                 | 1M      | 8K         | Degraded performance |
| `gemini-2.5-pro`                 | 1M      | 65K        | Degraded performance |
| `gemini-2.5-flash`               | 1M      | 65K        | Degraded performance |
| `gemini-2.5-flash-lite`          | 1M      | 8K         | Degraded performance |
| `gemini-1.5-pro`                 | 2M      | 8K         | Degraded performance |

See [Google's thought_signature documentation](https://ai.google.dev/gemini-api/docs/thought-signatures) for details.

### Anthropic Claude

| Model               | Context | Max Output |
| ------------------- | ------- | ---------- |
| `claude-opus-5-5`   | 1M      | 128K       |
| `claude-opus-5`     | 1M      | 128K       |
| `claude-sonnet-5`   | 1M      | 128K       |
| `claude-fable-5`    | 1M      | 128K       |
| `claude-fable-5.1`  | 1M      | 128K       |
| `claude-opus-4-8`   | 1M      | 32K        |
| `claude-opus-4-7`   | 1M      | 32K        |
| `claude-opus-4-6`   | 1M      | 32K        |
| `claude-opus-4-5`   | 200K    | 32K        |
| `claude-sonnet-4-6` | 200K    | 64K        |
| `claude-sonnet-4-5` | 200K    | 64K        |
| `claude-haiku-4-5`  | 200K    | 16K        |

### OpenAI

| Model           | Context | Max Output |
| --------------- | ------- | ---------- |
| `gpt-6-astra`   | 1.1M    | 128K       |
| `gpt-6-sol`     | 1.1M    | 128K       |
| `gpt-6-luna`    | 1.1M    | 128K       |
| `gpt-5.6-sol`   | 1.1M    | 128K       |
| `gpt-5.6-terra` | 1.1M    | 128K       |
| `gpt-5.6-luna`  | 1.1M    | 128K       |
| `gpt-5.5`       | 1M      | 16K        |
| `gpt-5.5-pro`   | 1M      | 128K       |
| `gpt-5.4`       | 1M      | 16K        |
| `gpt-5.4-pro`   | 1M      | 16K        |
| `gpt-5.4-mini`  | 400K    | 16K        |
| `gpt-5.4-nano`  | 400K    | 16K        |
| `gpt-5.2`       | 128K    | 16K        |
| `gpt-5.1`       | 400K    | 16K        |
| `gpt-5`         | 128K    | 16K        |
| `gpt-4.1`       | 1M      | 32K        |
| `gpt-4o`        | 128K    | 16K        |
| `o3`            | 200K    | 100K       |
| `gpt-oss-120b`  | 128K    | 32K        |
| `gpt-oss-20b`   | 128K    | 32K        |

### xAI (xai)

| Model                          | Context | Max Output |
| ------------------------------ | ------- | ---------- |
| `grok-4.7`                     | 500K    | 32K        |
| `grok-4.6`                     | 500K    | 32K        |
| `grok-4.5`                     | 500K    | 32K        |
| `grok-4.3`                     | 1M      | 32K        |
| `grok-4.20-0309-reasoning`     | 2M      | 32K        |
| `grok-4.20-0309-non-reasoning` | 2M      | 32K        |
| `grok-4.20-multi-agent-0309`   | 2M      | 32K        |

### Other providers

The catalog also includes DeepSeek (`deepseek/deepseek-v4-pro`), Alibaba Qwen
(`alibaba/qwen3.8-max`, `qwen3.7-max`, `qwen3.7-plus`, `qwen3.5-397b-a17b`,
`qwen3-max`), Moonshot (`moonshotai/kimi-k3`, `moonshotai/kimi-k2.6`,
`moonshotai/kimi-k2.7-code`), MiniMax (`minimax/m3`, `minimax/m2.7`), Google
Gemma 4 (`google/gemma-4-26b-a4b-it`), Worker AI frontier models
(`workers-ai/@cf/zai-org/glm-5.2`, `workers-ai/@cf/moonshotai/kimi-k2.6`,
`workers-ai/@cf/moonshotai/kimi-k2.7-code`,
`workers-ai/@cf/deepseek-ai/deepseek-v4-pro-0813`), plus the Groq, Mistral,
Cohere, Perplexity, Cerebras, Baseten, and Parallel families. See
`src/models.ts` for the full list and pricing.

## Cloudflare API Token Permissions

This plugin requires the following credentials:

| Variable                        | Type       | Purpose                                                          |
| ------------------------------- | ---------- | ---------------------------------------------------------------- |
| `CLOUDFLARE_AI_GATEWAY_API_KEY` | API key    | AI-scoped credential used by the native gateway provider         |
| `CLOUDFLARE_API_TOKEN`          | API token  | REST API Bearer credential                                       |
| `CF_AI_GATEWAY_ACCOUNT_ID`      | Account ID | REST API URL construction                                        |
| `CF_AI_GATEWAY_GATEWAY_ID`      | Gateway ID | `cf-aig-gateway-id` header for gateway routing (billing/logging) |

The AI credential must be a real account-level Cloudflare credential with the AI
Gateway and Workers AI permissions required by the selected REST models. Requests
are authenticated against `api.cloudflare.com` by sending the
`CLOUDFLARE_API_TOKEN` value as the Bearer `Authorization` header; the
`cf-aig-gateway-id` header routes them through the configured gateway for unified
billing and logging.

## Security & data handling

This plugin reads Cloudflare credentials from the environment, the OpenClaw auth
store, or plugin/provider config, and sends them **only** to Cloudflare — either
`api.cloudflare.com` or the `CF_AI_GATEWAY_CUSTOM_DOMAIN` you configure. It never
sends credentials to any other host, and credential-bearing headers are redacted
from debug logs. See [SECURITY.md](./SECURITY.md) for the full credential and data
flow.

## Development

```bash
bun run test                       # unit tests
bun run typecheck
bun run build
cp .dev.vars.example .dev.vars     # fill in credentials
PLUGIN_LIVE_TESTS=true bun run test:integration   # live, paid calls
```

## License

Source-available under the Paso4 Open Plugin License. See
[LICENSE](../../../LICENSE).
