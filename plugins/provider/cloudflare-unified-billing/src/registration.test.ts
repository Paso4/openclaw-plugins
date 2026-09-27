import { describe, it, expect } from 'vitest';
import { PROVIDER_ID, ALL_MODELS, resolveBaseUrl } from './models.js';

const CLASSIFY_FAILOVER_REGEX = /\bworkers?_ai\b.*\b(?:rate|limit|quota)\b/i;

function classifyFailoverReason({
  errorMessage,
}: {
  errorMessage: string;
}): 'rate_limit' | undefined {
  return CLASSIFY_FAILOVER_REGEX.test(errorMessage) ? 'rate_limit' : undefined;
}

describe('cloudflare-unified-billing plugin registration', () => {
  it('has correct provider id', () => {
    expect(PROVIDER_ID).toBe('cloudflare-unified-billing');
  });

  it('classifies rate limit errors correctly', () => {
    expect(classifyFailoverReason({ errorMessage: 'worker_ai rate limit exceeded' })).toBe(
      'rate_limit',
    );
    expect(classifyFailoverReason({ errorMessage: 'workers_ai quota exhausted' })).toBe(
      'rate_limit',
    );
    expect(classifyFailoverReason({ errorMessage: 'Worker AI rate limited' })).toBeUndefined();
    expect(classifyFailoverReason({ errorMessage: 'some other error' })).toBeUndefined();
    expect(classifyFailoverReason({ errorMessage: 'connection timeout' })).toBeUndefined();
  });

  it('resolves correct baseUrl format', () => {
    expect(resolveBaseUrl({ accountId: 'my-account', gatewayId: 'my-gateway' })).toBe(
      'https://api.cloudflare.com/client/v4/accounts/my-account/ai/v1',
    );
  });
});

describe('cloudflare-unified-billing model definitions', () => {
  it('all models have required fields', () => {
    for (const model of ALL_MODELS) {
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.contextWindow).toBeGreaterThan(0);
      expect(model.maxTokens).toBeGreaterThan(0);
      expect(model.cost).toBeDefined();
      expect(model.input).toBeDefined();
      expect(model.input.length).toBeGreaterThan(0);
    }
  });

  it('reasoning models have reasoning flag set', () => {
    const reasoningModels = ALL_MODELS.filter((m: any) => m.reasoning === true);
    const nonReasoningModels = ALL_MODELS.filter((m: any) => m.reasoning !== true);

    expect(reasoningModels.length).toBeGreaterThan(0);
    expect(nonReasoningModels.length).toBeGreaterThan(0);

    const expectedReasoningIds = [
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'anthropic/claude-opus-4-6',
      'anthropic/claude-sonnet-4-6',
      'openai/o3',
      'openai/o4-mini',
      'openai/o3-mini',
      'openai/o1',
    ];

    for (const id of expectedReasoningIds) {
      const model = ALL_MODELS.find((m: any) => m.id === id);
      expect(model?.reasoning).toBe(true);
    }
  });

  it('vision models support image input', () => {
    const visionModels = ALL_MODELS.filter((m: any) => m.input?.includes('image'));
    expect(visionModels.length).toBeGreaterThan(30);

    const expectedVisionIds = [
      'google/gemini-2.5-pro',
      'anthropic/claude-sonnet-4-6',
      'openai/gpt-4o',
    ];

    for (const id of expectedVisionIds) {
      const model = ALL_MODELS.find((m: any) => m.id === id);
      expect(model?.input).toContain('image');
    }
  });
});

// ── OpenClaw 2026.9.6 model additions ────────────────────────────────────────
// New chat-model choices shipped by OpenClaw 2026.9.6: Claude Opus 5.5,
// GPT-6 Sol / GPT-6 Luna, and Grok 4.7. Pricing/metadata mirror the shipped
// upstream catalog and the provider pages (see the model-catalog-research skill).
describe('cloudflare-unified-billing 2026.9.6 model additions', () => {
  const expected: Array<{
    id: string;
    name: string;
    contextWindow: number;
    maxTokens: number;
    cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  }> = [
    {
      id: 'anthropic/claude-opus-5-5',
      name: 'Claude Opus 5.5',
      contextWindow: 1000000,
      maxTokens: 128000,
      cost: { input: 4.0, output: 20.0, cacheRead: 0.2, cacheWrite: 5.0 },
    },
    {
      id: 'openai/gpt-6-sol',
      name: 'GPT-6 Sol',
      contextWindow: 1050000,
      maxTokens: 128000,
      cost: { input: 2.0, output: 10.0, cacheRead: 0.2, cacheWrite: 2.5 },
    },
    {
      id: 'openai/gpt-6-luna',
      name: 'GPT-6 Luna',
      contextWindow: 1050000,
      maxTokens: 128000,
      cost: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
    },
    {
      id: 'xai/grok-4.7',
      name: 'Grok 4.7',
      contextWindow: 500000,
      maxTokens: 32768,
      cost: { input: 2.0, output: 6.0, cacheRead: 0.5, cacheWrite: 0 },
    },
  ];

  it.each(expected)('includes $id with the shipped metadata', (entry) => {
    const model = ALL_MODELS.find((m: any) => m.id === entry.id);
    expect(model, `missing model ${entry.id}`).toBeDefined();
    expect(model?.name).toBe(entry.name);
    expect(model?.contextWindow).toBe(entry.contextWindow);
    expect(model?.maxTokens).toBe(entry.maxTokens);
    expect(model?.cost).toEqual(entry.cost);
    expect(model?.reasoning).toBe(true);
    expect(model?.input).toEqual(['text', 'image']);
  });
});
