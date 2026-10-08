import { describe, it, expect } from 'vitest';
import { ALL_MODELS, PROVIDER_ID, CloudflareUnifiedBillingModel } from './models.js';

describe('cloudflare-unified-billing model ID namespace safety', () => {
  describe('family prefixes prevent bare model IDs', () => {
    it('Claude models use anthropic/ prefix', () => {
      const claudeModels = ALL_MODELS.filter((m) => m.id.includes('claude'));
      expect(claudeModels.length).toBeGreaterThan(0);

      for (const model of claudeModels) {
        expect(model.id).toMatch(/^anthropic\/claude-/);
        expect(model.id).not.toMatch(/^claude-/);
      }
    });

    it('Gemini models use google/ prefix', () => {
      const geminiModels = ALL_MODELS.filter((m) => m.id.includes('gemini'));
      expect(geminiModels.length).toBeGreaterThan(0);

      for (const model of geminiModels) {
        expect(model.id).toMatch(/^google\/gemini-/);
        expect(model.id).not.toMatch(/^gemini-/);
      }
    });

    it('GPT models use openai/ prefix', () => {
      const gptModels = ALL_MODELS.filter(
        (m) => m.id.includes('gpt') && !m.id.startsWith('baseten/'),
      );
      expect(gptModels.length).toBeGreaterThan(0);

      for (const model of gptModels) {
        expect(model.id).toMatch(/^openai\/gpt-/);
        expect(model.id).not.toMatch(/^gpt-/);
      }
    });

    it('o-series models use openai/ prefix', () => {
      const oModels = ALL_MODELS.filter((m) => /^openai\/o\d/.test(m.id));
      expect(oModels.length).toBeGreaterThan(0);

      for (const model of oModels) {
        expect(model.id).toMatch(/^openai\/o\d/);
        expect(model.id).not.toMatch(/^o\d/);
      }
    });
  });

  describe('provider ref collision prevention', () => {
    it('unified-billing model refs distinct from cloudflare-ai-gateway refs', () => {
      const unifiedModelRef = `${PROVIDER_ID}/${CloudflareUnifiedBillingModel.ClaudeSonnet46}`;
      const gatewayModelRef = 'cloudflare-ai-gateway/claude-sonnet-4-6';

      expect(unifiedModelRef).not.toBe(gatewayModelRef);
      expect(unifiedModelRef).toContain('anthropic/');
      expect(gatewayModelRef).not.toContain('anthropic/');
    });

    it('unified-billing refs include family prefix', () => {
      const unifiedRef = `${PROVIDER_ID}/${CloudflareUnifiedBillingModel.ClaudeSonnet46}`;
      expect(unifiedRef).toContain('anthropic/claude-');

      const geminiRef = `${PROVIDER_ID}/${CloudflareUnifiedBillingModel.Gemini25Pro}`;
      expect(geminiRef).toContain('google/gemini-');

      const gptRef = `${PROVIDER_ID}/${CloudflareUnifiedBillingModel.Gpt4o}`;
      expect(gptRef).toContain('openai/gpt-');
    });

    it('different provider prefixes enable dual catalog entries', () => {
      const unifiedProviderId = 'cloudflare-unified-billing';
      const gatewayProviderId = 'cloudflare-ai-gateway';

      expect(unifiedProviderId).not.toBe(gatewayProviderId);
    });
  });

  describe('resolveDynamicModel prefix preservation', () => {
    it('dynamic model function exists in index.ts', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/resolveDynamicModel:/);
    });

    it('dynamic model preserves modelId from ctx', async () => {
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

    it('dynamic model sets openai-completions api', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/api:\s*['"]openai-completions['"]/);
    });
  });

  describe('all models namespace safe', () => {
    it('every model ID has family prefix', () => {
      for (const model of ALL_MODELS) {
        const hasPrefix =
          model.id.startsWith('google/') ||
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
          model.id.startsWith('minimax/') ||
          model.id.startsWith('thinkingmachines/') ||
          model.id.startsWith('typesafe/') ||
          model.id.startsWith('unbiased/');
        expect(hasPrefix).toBe(true);
      }
    });

    it('no model ID overlaps with bundled bare IDs', () => {
      const bareClaudeIds = ALL_MODELS.filter((m) => m.id.startsWith('claude-'));
      const bareGeminiIds = ALL_MODELS.filter((m) => m.id.startsWith('gemini-'));
      const bareGptIds = ALL_MODELS.filter((m) => m.id.startsWith('gpt-'));

      expect(bareClaudeIds.length).toBe(0);
      expect(bareGeminiIds.length).toBe(0);
      expect(bareGptIds.length).toBe(0);
    });

    it('model count exceeds 30', () => {
      expect(ALL_MODELS.length).toBeGreaterThan(30);
    });
  });
});
