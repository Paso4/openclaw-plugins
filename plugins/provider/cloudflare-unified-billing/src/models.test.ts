import { describe, it, expect } from 'vitest';
import { ALL_MODELS, CloudflareUnifiedBillingModel } from './models.js';

describe('cloudflare-unified-billing catalog entries', () => {
  it('exposes Gemini 4 Argon through the Cloudflare AI Gateway catalog', () => {
    const id = CloudflareUnifiedBillingModel.Gemini4Argon;
    expect(id).toBe('google/gemini-4-argon');

    const model = ALL_MODELS.find((m) => m.id === id);
    expect(model).toBeDefined();
    expect(model?.name).toBe('Gemini 4 Argon');
    expect(model?.reasoning).toBe(true);
    expect(model?.input).toContain('image');
    expect(model?.contextWindow).toBe(1048576);
    expect(model?.maxTokens).toBe(65536);
    // Cloudflare AI Gateway published pricing for google/gemini-4-argon.
    expect(model?.cost).toEqual({ input: 2.0, output: 10.0, cacheRead: 0.1, cacheWrite: 0 });
  });
});
