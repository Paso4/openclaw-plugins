# Integration Tests

Live integration tests for the `cloudflare-unified-billing` OpenClaw provider
plugin. They use `openclaw infer model run` to validate:

- Provider registration and catalog
- Model routing and resolution
- Dynamic model acceptance
- Vision and reasoning capabilities
- Error handling

> **These tests make real, paid provider calls.** They only run when
> `PLUGIN_LIVE_TESTS=true` is set, so they never execute on pull requests or in
> a default local `bun run test`. The `develop` CI job sets the opt-in and
> supplies credentials.

## Prerequisites

### 1. OpenClaw CLI

```bash
# macOS/Linux
curl -fsSL https://get.openclaw.ai | sh

# Or via npm (pin to the repo's compatible version)
npm install -g "openclaw@$(bun scripts/openclaw-version.mjs)"
```

### 2. Cloudflare AI Gateway credentials

```bash
cp .dev.vars.example .dev.vars
# fill in CLOUDFLARE_AI_GATEWAY_API_KEY, CF_AI_GATEWAY_ACCOUNT_ID, CF_AI_GATEWAY_GATEWAY_ID
```

Credentials come from the process environment first (how CI passes them), with
a local `.dev.vars` fallback.

## Usage

```bash
# Unit tests only (no spend) — the default
bun run test

# Live integration tests (spends credits)
PLUGIN_LIVE_TESTS=true bun run test:integration

# Everything
PLUGIN_LIVE_TESTS=true bun run test
PLUGIN_LIVE_TESTS=true bun run test:all
```

Run a single file:

```bash
PLUGIN_LIVE_TESTS=true bun vitest run tests/integration/provider-smoke.test.ts
```

## Test modes

- **Smoke** — cheapest model per provider family; validates the full
  auth → baseUrl → gateway → provider pipeline. ~10–15s, ~$0.01.
- **Full** — additional models, dynamic resolution, and contract validation.
  Enable deeper coverage with `RUN_REASONING_TESTS=true` and
  `RUN_VISION_TESTS=true`. ~60–90s, ~$0.50–$1.00.

## Environment variables

### Required (live)

| Variable                        | Description                            |
| ------------------------------- | -------------------------------------- |
| `PLUGIN_LIVE_TESTS`             | Must be `true` to run any live test    |
| `CLOUDFLARE_AI_GATEWAY_API_KEY` | AI-scoped credential for CF AI Gateway |
| `CLOUDFLARE_API_TOKEN`          | REST API Bearer credential             |
| `CF_AI_GATEWAY_ACCOUNT_ID`      | Cloudflare account ID                  |
| `CF_AI_GATEWAY_GATEWAY_ID`      | Gateway ID                             |

### Optional

| Variable              | Default | Description                             |
| --------------------- | ------- | --------------------------------------- |
| `SMOKE_TESTS_ONLY`    | `false` | Set to `true` to skip full tests        |
| `RUN_REASONING_TESTS` | `false` | Set to `true` to test reasoning models  |
| `RUN_VISION_TESTS`    | `false` | Set to `true` to test vision capability |

## Running locally

1. **Node.js >= 24** (OpenClaw engine requirement).
2. **The `openclaw` CLI**, pinned to the repo's compatible version.
3. **A valid AI-scoped Cloudflare credential** (`CLOUDFLARE_AI_GATEWAY_API_KEY`).
   `CLOUDFLARE_API_TOKEN` is used for the `api.cloudflare.com` REST API.
4. **A funded gateway**: `CF_AI_GATEWAY_GATEWAY_ID` must have unified-billing
   credits (or BYOK provider keys) for third-party models, otherwise the REST
   API returns `402 Insufficient balance`.

## CI integration

Live tests run in the `test` job of [`.github/workflows/test.yml`](../../../../.github/workflows/test.yml)
**only on pushes to `develop`**, with `PLUGIN_LIVE_TESTS=true` and credentials
from repository secrets. PRs run the unit suite only.

## Response shape

`openclaw infer model run --json` returns:

```json
{
  "ok": true,
  "capability": "model.run",
  "transport": "local",
  "provider": "cloudflare-unified-billing",
  "model": "anthropic/claude-sonnet-4-5",
  "attempts": [],
  "outputs": [{ "text": "Hello!", "mediaUrl": null }]
}
```

Key assertions: `ok` is `true`, `provider` is `cloudflare-unified-billing`,
`model` matches the requested id, and `outputs[0].text` is non-empty.

## Troubleshooting

- **`openclaw CLI not found`** — install the CLI (see Prerequisites).
- **Tests skipped** — this is expected unless `PLUGIN_LIVE_TESTS=true` and
  credentials are present.
- **Provider mismatch** — rebuild (`bun run build`) and reinstall
  (`openclaw plugins install ... --force --accept-capabilities`).
- **Vision tests fail** — ensure `RUN_VISION_TESTS=true` and a vision-capable
  model is selected.

## Cost estimates

| Mode                       | Models     | Duration | Cost   |
| -------------------------- | ---------- | -------- | ------ |
| Smoke                      | 3 cheapest | 10-15s   | ~$0.01 |
| Full (no reasoning/vision) | 6 models   | 30-40s   | ~$0.05 |
| Full + reasoning           | 8 models   | 45-60s   | ~$0.15 |
| Full + vision              | 10 tests   | 60-90s   | ~$0.30 |

## Related documentation

- [OpenClaw infer CLI](https://docs.openclaw.ai/cli/infer)
- [Provider plugin testing](https://docs.openclaw.ai/plugins/sdk-testing)
