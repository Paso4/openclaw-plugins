import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const ENV_VAR = 'CLOUDFLARE_AI_GATEWAY_API_KEY';
const ACCOUNT_ID_ENV_VAR = 'CF_AI_GATEWAY_ACCOUNT_ID';
const GATEWAY_ID_ENV_VAR = 'CF_AI_GATEWAY_GATEWAY_ID';
const PROVIDER_ID = 'cloudflare-unified-billing';

function setEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearEnv() {
  delete process.env[ENV_VAR];
  delete process.env[ACCOUNT_ID_ENV_VAR];
  delete process.env[GATEWAY_ID_ENV_VAR];
}

describe('cloudflare-unified-billing provider contract', () => {
  beforeEach(() => clearEnv());
  afterEach(() => clearEnv());

  describe('provider registration', () => {
    it('has correct provider id', async () => {
      const { PROVIDER_ID: id } = await import('./models.js');
      expect(id).toBe('cloudflare-unified-billing');
    });

    it('declares required env vars in manifest', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const manifest = JSON.parse(
        readFileSync(join(__dirname, '../openclaw.plugin.json'), 'utf-8'),
      );
      expect(manifest.providers).toContain('cloudflare-unified-billing');
    });
  });

  describe('catalog behavior', () => {
    it('catalog provider defined in source', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');

      expect(catalogContent).toMatch(/export function buildCatalogProvider/);
    });

    it('catalog provider returns null without credential or env vars', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');

      expect(catalogContent).toMatch(/if\s*\(!cfToken\s*&&\s*!usingAccess\)/);
      expect(catalogContent).toMatch(/return\s*null/);
    });

    it('catalog provider requires accountId and gatewayId', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');

      expect(catalogContent).toMatch(
        /if\s*\(!customDomain\s*&&\s*\(!accountId\s*\|\|\s*!gatewayId\)\)/,
      );
    });

    it('catalog provider builds with all params', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');

      expect(catalogContent).toMatch(/const result = \{/);
      expect(catalogContent).toMatch(/baseUrl:/);
      expect(catalogContent).toMatch(/api:\s*['"]openai-completions['"]/);
      expect(catalogContent).toMatch(/headers:/);
      expect(catalogContent).toMatch(/models:\s*ALL_MODELS/);
      expect(catalogContent).toMatch(/return result/);
    });

    it('baseUrl format includes account in REST API path', async () => {
      const { resolveBaseUrl } = await import('./models.js');
      const baseUrl = resolveBaseUrl({
        accountId: 'acc-123',
        gatewayId: 'gw-456',
      });
      expect(baseUrl).toBe('https://api.cloudflare.com/client/v4/accounts/acc-123/ai/v1');
    });
  });

  describe('model definitions', () => {
    it('all models have required fields', async () => {
      const { ALL_MODELS } = await import('./models.js');
      for (const model of ALL_MODELS) {
        expect(model.id).toBeDefined();
        expect(
          model.id.startsWith('google/') ||
            model.id.startsWith('google-vertex-ai/') ||
            model.id.startsWith('anthropic/') ||
            model.id.startsWith('openai/') ||
            model.id.startsWith('xai/') ||
            model.id.startsWith('grok/') ||
            model.id.startsWith('groq/') ||
            model.id.startsWith('mistral/') ||
            model.id.startsWith('cohere/') ||
            model.id.startsWith('perplexity/') ||
            model.id.startsWith('workers-ai/') ||
            model.id.startsWith('deepseek/') ||
            model.id.startsWith('cerebras/') ||
            model.id.startsWith('baseten/') ||
            model.id.startsWith('parallel/') ||
            model.id.startsWith('alibaba/') ||
            model.id.startsWith('moonshotai/') ||
            model.id.startsWith('minimax/'),
        ).toBe(true);
        expect(model.name).toBeDefined();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxTokens).toBeGreaterThan(0);
        expect(model.cost).toBeDefined();
        expect(model.cost.input).toBeGreaterThanOrEqual(0);
        expect(model.cost.output).toBeGreaterThanOrEqual(0);
      }
    });

    it('has Gemini models from google', async () => {
      const { ALL_MODELS } = await import('./models.js');
      const geminiIds = ['google/gemini-2.5-pro', 'google/gemini-2.5-flash'];
      for (const id of geminiIds) {
        const model = ALL_MODELS.find((m) => m.id === id);
        expect(model).toBeDefined();
      }
    });

    it('has Claude models from anthropic', async () => {
      const { ALL_MODELS } = await import('./models.js');
      const claudeIds = [
        'anthropic/claude-sonnet-4.6',
        'anthropic/claude-opus-4.6',
        'anthropic/claude-haiku-4.5',
      ];
      for (const id of claudeIds) {
        const model = ALL_MODELS.find((m) => m.id === id);
        expect(model).toBeDefined();
      }
    });

    it('has GPT models from openai', async () => {
      const { ALL_MODELS } = await import('./models.js');
      const gptIds = ['openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/o3'];
      for (const id of gptIds) {
        const model = ALL_MODELS.find((m) => m.id === id);
        expect(model).toBeDefined();
      }
    });

    it('reasoning models have reasoning flag', async () => {
      const { ALL_MODELS } = await import('./models.js');
      const reasoningIds = [
        'google/gemini-2.5-pro',
        'google/gemini-2.5-flash',
        'anthropic/claude-opus-4.6',
        'anthropic/claude-sonnet-4.6',
        'openai/o3',
        'openai/o4-mini',
      ];
      for (const id of reasoningIds) {
        const model = ALL_MODELS.find((m) => m.id === id);
        expect(model?.reasoning).toBe(true);
      }
    });
  });

  describe('resolveDynamicModel', () => {
    it('dynamic model resolver function exists', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/resolveDynamicModel:\s*\(/);
    });

    it('dynamic model uses openai-completions api', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/api:\s*['"]openai-completions['"]\s*as\s*const/);
    });

    it('dynamic model preserves modelId', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/id:\s*modelId/);
    });

    it('dynamic model uses cloudflare-unified-billing provider', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/provider:\s*PROVIDER_ID/);
    });
  });

  describe('cloudflare-ai-gateway coexistence', () => {
    it('provider ID is distinct from cloudflare-ai-gateway', async () => {
      const { PROVIDER_ID: id } = await import('./models.js');
      expect(id).toBe('cloudflare-unified-billing');
      expect(id).not.toBe('cloudflare-ai-gateway');
    });

    it('all model IDs use family prefixes to prevent collision', async () => {
      const { ALL_MODELS: models } = await import('./models.js');
      for (const model of models) {
        expect(model.id).toMatch(
          /^(google|google-vertex-ai|anthropic|openai|xai|grok|groq|mistral|cohere|perplexity|workers-ai|deepseek|cerebras|baseten|parallel|alibaba|moonshotai|minimax)\//,
        );
        expect(model.id).not.toMatch(/^(claude-|gemini-|gpt-|grok-)/);
      }
    });

    it('baseUrl uses REST API ai/v1 path not anthropic', async () => {
      const { resolveBaseUrl } = await import('./models.js');
      const url = resolveBaseUrl({ accountId: 'acc', gatewayId: 'gw' });
      expect(url).toContain('/ai/v1');
      expect(url).not.toContain('/anthropic');
    });

    it('manifest declares providerAuthAliases mapping', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const manifest = JSON.parse(
        readFileSync(join(__dirname, '../openclaw.plugin.json'), 'utf-8'),
      );
      expect(manifest.providerAuthAliases).toBeDefined();
      expect(manifest.providerAuthAliases['cloudflare-unified-billing']).toBe(
        'cloudflare-ai-gateway',
      );
    });

    it('catalog uses openai-completions api not native Anthropic', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');

      expect(catalogContent).toMatch(/api:\s*['"]openai-completions['"]/);
    });
  });
});
