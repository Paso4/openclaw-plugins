# Security & data handling

This plugin is a Cloudflare AI Gateway provider. To do its job it reads
Cloudflare credentials from the environment and sends them to Cloudflare with each
request. This file documents that flow so operators and reviewers can assess it.

## Credentials the plugin reads

| Variable                        | Purpose                                           |
| ------------------------------- | ------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`          | Bearer credential for the Cloudflare REST API     |
| `CLOUDFLARE_AI_GATEWAY_API_KEY` | AI-scoped credential for gateway-native calls     |
| `CF_AI_GATEWAY_ACCOUNT_ID`      | Account id used to build the REST base URL        |
| `CF_AI_GATEWAY_GATEWAY_ID`      | Gateway id sent as the `cf-aig-gateway-id` header |
| `CF_AI_GATEWAY_CUSTOM_DOMAIN`   | Optional custom-domain host                       |
| `CF_ACCESS_TOKEN`               | Optional Cloudflare Access user JWT               |
| `CF_ACCESS_CLIENT_ID`           | Optional Access service-token client id           |
| `CF_ACCESS_CLIENT_SECRET`       | Optional Access service-token client secret       |

Credentials may also come from the OpenClaw auth store (profiles named
`cloudflare-unified-billing` or the aliased `cloudflare-ai-gateway`) or from
plugin/provider config (`cfAiGatewayApiKey`, Authorization header).

## Where credentials are sent

Only to Cloudflare:

- `https://api.cloudflare.com/client/v4/accounts/<account>/ai/v1` (default), or
- `https://<custom-domain>/compat` when `CF_AI_GATEWAY_CUSTOM_DOMAIN` is set.

Model inference, web search, web fetch, and image generation all use the same
configured base URL. No credentials are sent to any other host.

## Logging

Credential-bearing request headers are redacted before any debug log line is
emitted (`redactHeadersForLog` in `src/index.ts`), and API keys are never logged.

## Static-analysis findings

ClawHub's automated audit flags this plugin for:

- **`suspicious.env_credential_access`** — expected and intentional. Reading
  provider credentials from the environment and sending them to the configured
  provider is the core function of a provider plugin; see the credential and
  network flow above.
- **`suspicious.exposed_secret_literal`** — a documentation false positive. An
  earlier README rendered the Access header as a `cf-access-token` pair with an
  angle-bracket placeholder value, which the scanner read as a hardcoded token.
  The README now describes the header in prose and contains no credential
  literals.
