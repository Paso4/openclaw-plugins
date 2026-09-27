import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('cloudflare-unified-billing auth discovery', () => {
  const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');
  const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');

  describe('providerAuthAliases manifest declaration', () => {
    it('manifest declares cloudflare-ai-gateway as auth alias', () => {
      const manifest = JSON.parse(
        readFileSync(join(__dirname, '../openclaw.plugin.json'), 'utf-8'),
      );
      expect(manifest.providerAuthAliases).toBeDefined();
      expect(manifest.providerAuthAliases['cloudflare-unified-billing']).toBe(
        'cloudflare-ai-gateway',
      );
    });

    it('auth alias enables profile sharing with bundled provider', () => {
      const manifest = JSON.parse(
        readFileSync(join(__dirname, '../openclaw.plugin.json'), 'utf-8'),
      );
      const alias = manifest.providerAuthAliases?.['cloudflare-unified-billing'];
      expect(alias).toBe('cloudflare-ai-gateway');
    });
  });

  describe('auth.ts integration', () => {
    it('catalog-provider imports normalizeOptionalString from SDK', () => {
      expect(catalogContent).toMatch(/normalizeOptionalString/);
      expect(catalogContent).toMatch(/from\s*['"]openclaw\/plugin-sdk\/string-coerce-runtime['"]/);
    });

    it('catalog-provider uses normalizeOptionalString for credential extraction', () => {
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.credential\.key\)/);
    });

    it('catalog-provider extracts accountId and gatewayId from credential metadata', () => {
      expect(catalogContent).toMatch(/params\.credential\.metadata\?\.accountId/);
      expect(catalogContent).toMatch(/params\.credential\.metadata\?\.gatewayId/);
    });

    it('catalog-provider does not define duplicate CredentialInput type', () => {
      expect(catalogContent).not.toMatch(/export\s+type\s+CredentialInput\s*=/);
    });

    it('catalog-provider does not define duplicate resolveCredentialMetadata function', () => {
      expect(catalogContent).not.toMatch(/function\s+resolveCredentialMetadata\s*\(/);
    });
  });

  describe('cross-provider auth profile discovery', () => {
    it('catalog checks both provider IDs for profiles', () => {
      expect(indexContent).toMatch(/ALIASED_PROVIDER\s*=\s*['"]cloudflare-ai-gateway['"]/);
      expect(indexContent).toMatch(/providerIdsToCheck\s*=\s*\[PROVIDER_ID,\s*ALIASED_PROVIDER\]/);
    });

    it('discoveres cloudflare-ai-gateway auth profiles', () => {
      expect(indexContent).toMatch(/listProfilesForProvider\(authStore,\s*providerId\)/);
    });

    it('accountId and gatewayId resolved from credential metadata', () => {
      expect(catalogContent).toMatch(
        /normalizeOptionalString\(params\.credential\.metadata\?\.accountId\)/,
      );
      expect(catalogContent).toMatch(
        /normalizeOptionalString\(params\.credential\.metadata\?\.gatewayId\)/,
      );
    });

    it('env vars fallback when credential metadata missing', () => {
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envAccountId\)/);
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envGatewayId\)/);
    });

    it('prefers the REST API token before profile and gateway credentials', () => {
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envApiToken\)/);
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envAccountId\)/);
    });

    it('keeps the gateway key as a fallback for older environments', () => {
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envApiKey\)/);
    });
  });

  describe('auth profile structure validation', () => {
    it('catalog provider builds auth headers through the shared helper', () => {
      expect(catalogContent).toMatch(/buildGatewayAuthHeaders/);
      expect(catalogContent).toMatch(/apiToken:\s*cfToken/);
    });

    it('gateway auth helper sets the cf-aig-gateway-id routing header', () => {
      const accessContent = readFileSync(join(__dirname, 'access.ts'), 'utf-8');
      expect(accessContent).toMatch(/['"]cf-aig-gateway-id['"]\]\s*=\s*params\.gatewayId/);
    });
  });
});
