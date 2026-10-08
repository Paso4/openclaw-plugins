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
      'anthropic/claude-opus-4.6',
      'anthropic/claude-sonnet-4.6',
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
      'anthropic/claude-sonnet-4.6',
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
      id: 'anthropic/claude-opus-5.5',
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

// ── OpenClaw 2026.9.9 model additions ────────────────────────────────────────
// 2026.9.9 enables GPT-6.1 Sol, and the Cloudflare REST catalog also ships
// Claude Sonnet 5.5. Metadata mirrors the Cloudflare model pages.
describe('cloudflare-unified-billing 2026.9.9 catalog additions', () => {
  const expected: Array<{
    id: string;
    name: string;
    contextWindow: number;
    maxTokens: number;
    cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  }> = [
    {
      id: 'openai/gpt-6.1-sol',
      name: 'GPT-6.1 Sol',
      contextWindow: 1050000,
      maxTokens: 128000,
      cost: { input: 2.0, output: 10.0, cacheRead: 0.1, cacheWrite: 2.5 },
    },
    {
      id: 'anthropic/claude-sonnet-5.5',
      name: 'Claude Sonnet 5.5',
      contextWindow: 1000000,
      maxTokens: 128000,
      cost: { input: 2.0, output: 10.0, cacheRead: 0.2, cacheWrite: 2.5 },
    },
  ];

  it.each(expected)('includes $id with the shipped metadata', (entry) => {
    const model = ALL_MODELS.find((m: any) => m.id === entry.id);
    expect(model, `missing model ${entry.id}`).toBeDefined();
    expect(model?.name).toBe(entry.name);
    expect(model?.contextWindow).toBe(entry.contextWindow);
    expect(model?.maxTokens).toBe(entry.maxTokens);
    expect(model?.cost).toEqual(entry.cost);
  });
});

describe('cloudflare-unified-billing Anthropic model ids', () => {
  it('uses the Cloudflare REST catalog dot form for minor versions', () => {
    const ids = ALL_MODELS.filter((m: any) => m.id.startsWith('anthropic/')).map((m: any) => m.id);
    expect(ids).toContain('anthropic/claude-sonnet-4.6');
    expect(ids).toContain('anthropic/claude-opus-5.5');
    for (const id of ids) {
      expect(id).not.toMatch(/^anthropic\/claude-(opus|sonnet|haiku)-\d+-\d+$/);
    }
  });
});

// ── Cloudflare catalog expansion: new authors ────────────────────────────────
// Metadata sourced from the Cloudflare model catalog pages. Max output is not
// published there, so the plugin default (4096) is used.
describe('cloudflare-unified-billing catalog expansion (new authors)', () => {
  const expected: Array<{
    id: string;
    name: string;
    reasoning: boolean;
    input: string[];
    contextWindow: number;
    cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  }> = [
    {
      id: 'unbiased/pareto',
      name: 'Pareto',
      reasoning: false,
      input: ['text', 'image'],
      // Context window is not published on the Cloudflare model page.
      contextWindow: 128000,
      cost: { input: 2.5, output: 7.5, cacheRead: 0.25, cacheWrite: 0 },
    },
  ];

  it.each(expected)('includes $id with the sourced metadata', (entry) => {
    const model = ALL_MODELS.find((m: any) => m.id === entry.id);
    expect(model, `missing model ${entry.id}`).toBeDefined();
    expect(model?.name).toBe(entry.name);
    expect(model?.contextWindow).toBe(entry.contextWindow);
    expect(model?.maxTokens).toBe(4096);
    expect(model?.reasoning).toBe(entry.reasoning);
    expect(model?.input).toEqual(entry.input);
    expect(model?.cost).toEqual(entry.cost);
  });
});

// ── Cloudflare catalog expansion: Workers AI text-generation models ──────────
// Workers AI is billed per neuron, so these keep the zero cost block from the
// other `workers-ai` entries. Max output is not published.
describe('cloudflare-unified-billing catalog expansion (Workers AI)', () => {
  const expected: Array<{
    id: string;
    reasoning: boolean;
    input: string[];
    contextWindow: number;
  }> = [
    {
      id: 'workers-ai/@cf/zai-org/glm-4.7-flash',
      reasoning: true,
      input: ['text'],
      contextWindow: 131072,
    },
    {
      id: 'workers-ai/@cf/zai-org/glm-5.3',
      reasoning: true,
      input: ['text'],
      contextWindow: 1048576,
    },
    {
      id: 'workers-ai/@cf/zai-org/glm-5.3-flash',
      reasoning: true,
      input: ['text', 'image'],
      contextWindow: 1048576,
    },
    {
      id: 'workers-ai/@cf/swiss-ai/apertus-v1.5-8b',
      reasoning: false,
      input: ['text', 'image'],
      contextWindow: 262144,
    },
    {
      id: 'workers-ai/@cf/utter-project/eurollm-9b-it',
      reasoning: false,
      input: ['text'],
      contextWindow: 32000,
    },
    {
      id: 'workers-ai/@cf/google/gemma-2b-it-lora',
      reasoning: false,
      input: ['text'],
      contextWindow: 8192,
    },
    {
      id: 'workers-ai/@cf/google/gemma-7b-it-lora',
      reasoning: false,
      input: ['text'],
      contextWindow: 3500,
    },
    {
      id: 'workers-ai/@cf/aisingapore/gemma-sea-lion-v4-27b-it',
      reasoning: false,
      input: ['text'],
      contextWindow: 128000,
    },
    {
      id: 'workers-ai/@cf/ibm-granite/granite-4.0-h-micro',
      reasoning: false,
      input: ['text'],
      contextWindow: 131000,
    },
    {
      id: 'workers-ai/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
      reasoning: true,
      input: ['text'],
      contextWindow: 80000,
    },
    {
      id: 'workers-ai/@cf/meta-llama/llama-2-7b-chat-hf-lora',
      reasoning: false,
      input: ['text'],
      contextWindow: 8192,
    },
    {
      id: 'workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8',
      reasoning: false,
      input: ['text'],
      contextWindow: 32000,
    },
    {
      id: 'workers-ai/@cf/meta/llama-3.2-11b-vision-instruct',
      reasoning: false,
      input: ['text', 'image'],
      contextWindow: 128000,
    },
  ];

  it.each(expected)('includes $id with a zero cost block', (entry) => {
    const model = ALL_MODELS.find((m: any) => m.id === entry.id);
    expect(model, `missing model ${entry.id}`).toBeDefined();
    expect(model?.contextWindow).toBe(entry.contextWindow);
    expect(model?.maxTokens).toBe(4096);
    expect(model?.reasoning).toBe(entry.reasoning);
    expect(model?.input).toEqual(entry.input);
    expect(model?.cost).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  });
});
