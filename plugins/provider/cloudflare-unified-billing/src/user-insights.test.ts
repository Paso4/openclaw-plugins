import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  normalizeCustomDomain,
  customDomainFromBaseUrl,
  resolveBaseUrl,
  PROVIDER_ID,
} from './models.js';
import {
  ACCESS_TOKEN_ENV_VAR,
  ACCESS_CLIENT_ID_ENV_VAR,
  ACCESS_CLIENT_SECRET_ENV_VAR,
  buildAccessHeaders,
  buildGatewayAuthHeaders,
  hasAccessCredentials,
  readAccessCredentials,
} from './access.js';
import { buildCatalogProvider } from './catalog-provider.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REST_BASE_URL = 'https://api.cloudflare.com/client/v4/accounts/my-account/ai/v1';

describe('User Insights custom domain support', () => {
  describe('normalizeCustomDomain', () => {
    it('accepts bare hostnames', () => {
      expect(normalizeCustomDomain('ai.example.com')).toBe('ai.example.com');
    });

    it('accepts hostnames with a port', () => {
      expect(normalizeCustomDomain('ai.example.com:8443')).toBe('ai.example.com:8443');
    });

    it('extracts the host from a full URL', () => {
      expect(normalizeCustomDomain('https://ai.example.com/compat')).toBe('ai.example.com');
    });

    it('strips trailing slashes', () => {
      expect(normalizeCustomDomain('ai.example.com/')).toBe('ai.example.com');
    });

    it('trims whitespace', () => {
      expect(normalizeCustomDomain('  ai.example.com  ')).toBe('ai.example.com');
    });

    it('rejects empty, pathful, or malformed values', () => {
      expect(normalizeCustomDomain(undefined)).toBeUndefined();
      expect(normalizeCustomDomain('')).toBeUndefined();
      expect(normalizeCustomDomain('   ')).toBeUndefined();
      expect(normalizeCustomDomain('ai.example.com/some/path')).toBeUndefined();
      expect(normalizeCustomDomain('not a host')).toBeUndefined();
      expect(normalizeCustomDomain(42)).toBeUndefined();
    });
  });

  describe('customDomainFromBaseUrl', () => {
    it('returns undefined for the Cloudflare REST endpoint', () => {
      expect(customDomainFromBaseUrl(REST_BASE_URL)).toBeUndefined();
    });

    it('returns undefined for the default gateway endpoint', () => {
      expect(
        customDomainFromBaseUrl('https://gateway.ai.cloudflare.com/v1/account/gateway/compat'),
      ).toBeUndefined();
    });

    it('returns the host for a custom domain', () => {
      expect(customDomainFromBaseUrl('https://ai.example.com/compat')).toBe('ai.example.com');
    });
  });

  describe('resolveBaseUrl', () => {
    it('uses the REST API by default', () => {
      expect(resolveBaseUrl({ accountId: 'my-account', gatewayId: 'my-gateway' })).toBe(
        REST_BASE_URL,
      );
    });

    it('routes through the custom domain /compat endpoint when configured', () => {
      expect(
        resolveBaseUrl({
          accountId: 'my-account',
          gatewayId: 'my-gateway',
          customDomain: 'ai.example.com',
        }),
      ).toBe('https://ai.example.com/compat');
    });

    it('does not require account/gateway IDs on a custom domain', () => {
      expect(resolveBaseUrl({ customDomain: 'https://ai.example.com' })).toBe(
        'https://ai.example.com/compat',
      );
    });

    it('ignores an invalid custom domain and falls back to REST', () => {
      expect(
        resolveBaseUrl({
          accountId: 'my-account',
          gatewayId: 'my-gateway',
          customDomain: 'ai.example.com/path',
        }),
      ).toBe(REST_BASE_URL);
    });
  });

  describe('Access credentials', () => {
    it('reads credentials from env', () => {
      const creds = readAccessCredentials({
        [ACCESS_TOKEN_ENV_VAR]: ' user-jwt ',
        [ACCESS_CLIENT_ID_ENV_VAR]: 'client-id',
        [ACCESS_CLIENT_SECRET_ENV_VAR]: 'client-secret',
      });
      expect(creds).toEqual({
        token: 'user-jwt',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      });
    });

    it('treats empty values as absent', () => {
      expect(readAccessCredentials({ [ACCESS_TOKEN_ENV_VAR]: '   ' }).token).toBeUndefined();
      expect(hasAccessCredentials({})).toBe(false);
    });

    it('builds a user Access token header', () => {
      expect(buildAccessHeaders({ token: 'jwt' })).toEqual({ 'cf-access-token': 'jwt' });
    });

    it('builds service-token headers only when both halves are present', () => {
      expect(buildAccessHeaders({ clientId: 'id', clientSecret: 'secret' })).toEqual({
        'CF-Access-Client-Id': 'id',
        'CF-Access-Client-Secret': 'secret',
      });
      expect(buildAccessHeaders({ clientId: 'id' })).toEqual({});
    });

    it('prefers the user token over service credentials', () => {
      expect(buildAccessHeaders({ token: 'jwt', clientId: 'id', clientSecret: 'secret' })).toEqual({
        'cf-access-token': 'jwt',
      });
    });
  });

  describe('buildGatewayAuthHeaders', () => {
    it('uses an Access credential on an Access-protected custom domain', () => {
      const headers = buildGatewayAuthHeaders({
        apiToken: 'gateway-token',
        gatewayId: 'my-gateway',
        customDomain: 'ai.example.com',
        access: { token: 'jwt' },
      });
      expect(headers).toEqual({ 'cf-access-token': 'jwt' });
      expect(headers.Authorization).toBeUndefined();
      expect(headers['cf-aig-gateway-id']).toBeUndefined();
    });

    it('uses the AI Gateway token on a custom domain without Access', () => {
      const headers = buildGatewayAuthHeaders({
        apiToken: 'gateway-token',
        gatewayId: 'my-gateway',
        customDomain: 'ai.example.com',
      });
      expect(headers).toEqual({ Authorization: 'Bearer gateway-token' });
    });

    it('uses the AI Gateway token and gateway routing header on the default endpoint', () => {
      const headers = buildGatewayAuthHeaders({
        apiToken: 'gateway-token',
        gatewayId: 'my-gateway',
      });
      expect(headers).toEqual({
        Authorization: 'Bearer gateway-token',
        'cf-aig-gateway-id': 'my-gateway',
      });
    });
  });

  describe('buildCatalogProvider custom domain', () => {
    it('uses the custom domain /compat route with Access auth and no IDs', () => {
      const result = buildCatalogProvider({
        envCustomDomain: 'ai.example.com',
        envAccess: { token: 'user-jwt' },
      });

      expect(result).not.toBeNull();
      expect(result?.baseUrl).toBe('https://ai.example.com/compat');
      expect(result?.headers).toEqual({ 'cf-access-token': 'user-jwt' });
    });

    it('uses the custom domain with the gateway token when Access is not configured', () => {
      const result = buildCatalogProvider({
        envCustomDomain: 'ai.example.com',
        envApiToken: 'ai-rest-token',
      });

      expect(result).not.toBeNull();
      expect(result?.baseUrl).toBe('https://ai.example.com/compat');
      expect(result?.headers).toEqual({ Authorization: 'Bearer ai-rest-token' });
    });

    it('does not build a provider when a custom domain has no auth at all', () => {
      const result = buildCatalogProvider({ envCustomDomain: 'ai.example.com' });
      expect(result).toBeNull();
    });

    it('keeps the REST route when no custom domain is configured', () => {
      const result = buildCatalogProvider({
        envApiToken: 'ai-rest-token',
        envAccountId: 'my-account',
        envGatewayId: 'my-gateway',
      });

      expect(result?.baseUrl).toBe(REST_BASE_URL);
      expect(result?.headers).toEqual({
        Authorization: 'Bearer ai-rest-token',
        'cf-aig-gateway-id': 'my-gateway',
      });
    });

    it('exposes the provider under the expected id', () => {
      expect(PROVIDER_ID).toBe('cloudflare-unified-billing');
    });
  });

  describe('manifest declares custom domain + Access env vars', () => {
    const manifest = JSON.parse(readFileSync(join(__dirname, '../openclaw.plugin.json'), 'utf-8'));
    const envVars = manifest.setup.providers[0].envVars as string[];

    it('declares the custom domain env var', () => {
      expect(envVars).toContain('CF_AI_GATEWAY_CUSTOM_DOMAIN');
    });

    it('declares the Access credential env vars', () => {
      expect(envVars).toContain('CF_ACCESS_TOKEN');
      expect(envVars).toContain('CF_ACCESS_CLIENT_ID');
      expect(envVars).toContain('CF_ACCESS_CLIENT_SECRET');
    });
  });
});
