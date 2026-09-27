import { describe, it, expect } from 'vitest';
import { buildCatalogProvider } from './catalog-provider.js';
import { ALL_MODELS } from './models.js';

describe('buildCatalogProvider', () => {
  it('returns null when no credential and no envApiKey provided', () => {
    const result = buildCatalogProvider({ credential: undefined });
    expect(result).toBeNull();
  });

  it('returns null when credential has no apiKey', () => {
    const result = buildCatalogProvider({
      credential: { type: 'api_key', key: undefined },
    });
    expect(result).toBeNull();
  });

  it('returns null when credential has empty apiKey', () => {
    const result = buildCatalogProvider({
      credential: { type: 'api_key', key: '' },
    });
    expect(result).toBeNull();
  });

  it('returns null when credential is not api_key type', () => {
    const result = buildCatalogProvider({
      credential: { type: 'oauth', key: 'some-key' },
    });
    expect(result).toBeNull();
  });

  it('returns null when credential has apiKey but no accountId', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'test-api-key',
        metadata: { gatewayId: 'test-gateway' },
      },
    });
    expect(result).toBeNull();
  });

  it('returns null when credential has apiKey but no gatewayId', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'test-api-key',
        metadata: { accountId: 'test-account' },
      },
    });
    expect(result).toBeNull();
  });

  it('returns null when envApiKey provided but no accountId/gatewayId', () => {
    const result = buildCatalogProvider({
      credential: { type: 'api_key', key: 'stored-key' },
      envApiKey: 'env-api-key',
    });
    expect(result).toBeNull();
  });

  it('returns provider with Authorization header for unified billing', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'stored-api-key',
        metadata: { accountId: 'test-account', gatewayId: 'test-gateway' },
      },
      envApiKey: 'env-api-key',
    });

    expect(result).not.toBeNull();
    expect(result?.baseUrl).toBe(
      'https://api.cloudflare.com/client/v4/accounts/test-account/ai/v1',
    );
    expect(result?.api).toBe('openai-completions');
    expect(result?.headers).toBeDefined();
    expect(result?.headers?.['Authorization']).toBe('Bearer env-api-key');
    expect(result?.headers?.['cf-aig-gateway-id']).toBe('test-gateway');
    expect(result?.models).toBe(ALL_MODELS);
  });

  it('prefers CLOUDFLARE_API_TOKEN for the REST API over the auth profile key', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'gateway-profile-key',
        metadata: { accountId: 'test-account', gatewayId: 'test-gateway' },
      },
      envApiToken: 'ai-rest-api-token',
      envApiKey: 'gateway-env-key',
    });

    expect(result?.headers?.['Authorization']).toBe('Bearer ai-rest-api-token');
  });

  it('returns provider with Authorization header and gateway routing', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'test-key',
        metadata: { accountId: 'test-account', gatewayId: 'test-gateway' },
      },
    });

    expect(result).not.toBeNull();
    expect(result?.headers?.['Authorization']).toBe('Bearer test-key');
    expect(result?.headers?.['cf-aig-gateway-id']).toBe('test-gateway');
  });

  it('returns provider with headers when no envApiKey', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'credential-api-key',
        metadata: { accountId: 'test-account', gatewayId: 'test-gateway' },
      },
    });

    expect(result).not.toBeNull();
    expect(result?.headers?.['Authorization']).toBe('Bearer credential-api-key');
    expect(result?.baseUrl).toBe(
      'https://api.cloudflare.com/client/v4/accounts/test-account/ai/v1',
    );
  });

  it('uses credential apiKey when envApiKey is empty string', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'credential-api-key',
        metadata: { accountId: 'test-account', gatewayId: 'test-gateway' },
      },
      envApiKey: '',
    });

    expect(result).not.toBeNull();
    expect(result?.headers?.['Authorization']).toBe('Bearer credential-api-key');
  });

  it('returns correct baseUrl format', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'test-key',
        metadata: { accountId: 'my-account', gatewayId: 'my-gateway' },
      },
    });

    expect(result?.baseUrl).toBe('https://api.cloudflare.com/client/v4/accounts/my-account/ai/v1');
  });

  it('returns all models in provider', () => {
    const result = buildCatalogProvider({
      credential: {
        type: 'api_key',
        key: 'test-key',
        metadata: { accountId: 'account', gatewayId: 'gateway' },
      },
    });

    expect(result?.models.length).toBeGreaterThan(30);
    expect(result?.models).toBe(ALL_MODELS);
  });

  describe('Cloudflare Unified Billing auth via Authorization header', () => {
    it('provider sets Authorization header with bearer token', () => {
      const result = buildCatalogProvider({
        credential: {
          type: 'api_key',
          key: 'test-api-key',
          metadata: { accountId: 'test-account', gatewayId: 'test-gateway' },
        },
      });

      expect(result).not.toBeNull();
      expect(result?.headers?.['Authorization']).toBe('Bearer test-api-key');
    });

    it('env vars provider sets Authorization header with bearer token', () => {
      const result = buildCatalogProvider({
        credential: undefined,
        envApiKey: 'env-token',
        envAccountId: 'env-account',
        envGatewayId: 'env-gateway',
      });

      expect(result).not.toBeNull();
      expect(result?.headers?.['Authorization']).toBe('Bearer env-token');
    });
  });

  describe('env var fallback for accountId and gatewayId', () => {
    it('returns provider when accountId/gatewayId from env vars', () => {
      const result = buildCatalogProvider({
        credential: undefined,
        envApiKey: 'env-api-key',
        envAccountId: 'env-account',
        envGatewayId: 'env-gateway',
      });

      expect(result).not.toBeNull();
      expect(result?.headers?.['Authorization']).toBe('Bearer env-api-key');
      expect(result?.baseUrl).toBe(
        'https://api.cloudflare.com/client/v4/accounts/env-account/ai/v1',
      );
    });

    it('uses env accountId when credential metadata missing accountId', () => {
      const result = buildCatalogProvider({
        credential: {
          type: 'api_key',
          key: 'cred-key',
          metadata: { gatewayId: 'cred-gateway' },
        },
        envAccountId: 'env-account',
      });

      expect(result).not.toBeNull();
      expect(result?.baseUrl).toBe(
        'https://api.cloudflare.com/client/v4/accounts/env-account/ai/v1',
      );
    });

    it('uses env gatewayId when credential metadata missing gatewayId', () => {
      const result = buildCatalogProvider({
        credential: {
          type: 'api_key',
          key: 'cred-key',
          metadata: { accountId: 'cred-account' },
        },
        envGatewayId: 'env-gateway',
      });

      expect(result).not.toBeNull();
      expect(result?.baseUrl).toBe(
        'https://api.cloudflare.com/client/v4/accounts/cred-account/ai/v1',
      );
    });

    it('current env account and gateway override stale credential metadata', () => {
      const result = buildCatalogProvider({
        credential: {
          type: 'api_key',
          key: 'cred-key',
          metadata: { accountId: 'cred-account', gatewayId: 'cred-gateway' },
        },
        envAccountId: 'env-account',
        envGatewayId: 'env-gateway',
      });

      expect(result).not.toBeNull();
      expect(result?.baseUrl).toBe(
        'https://api.cloudflare.com/client/v4/accounts/env-account/ai/v1',
      );
    });

    it('returns null when envAccountId is empty', () => {
      const result = buildCatalogProvider({
        credential: undefined,
        envApiKey: 'env-api-key',
        envAccountId: '',
        envGatewayId: 'env-gateway',
      });

      expect(result).toBeNull();
    });

    it('returns null when envGatewayId is empty', () => {
      const result = buildCatalogProvider({
        credential: undefined,
        envApiKey: 'env-api-key',
        envAccountId: 'env-account',
        envGatewayId: '',
      });

      expect(result).toBeNull();
    });
  });
});
