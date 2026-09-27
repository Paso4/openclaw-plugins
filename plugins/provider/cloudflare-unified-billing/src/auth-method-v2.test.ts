import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('cloudflare-unified-billing auth configuration after refactor', () => {
  const indexPath = join(__dirname, 'index.ts');
  const indexContent = readFileSync(indexPath, 'utf-8');

  describe('auth array removal', () => {
    it('does NOT have auth array with createProviderApiKeyAuthMethod', () => {
      // After refactor, auth should be removed or empty
      // Check that createProviderApiKeyAuthMethod is not imported or called
      expect(indexContent).not.toMatch(/createProviderApiKeyAuthMethod/);
    });

    it('uses ensureAuthProfileStore for profile discovery', () => {
      // Catalog uses auth profile storage to discover existing profiles
      expect(indexContent).toMatch(/ensureAuthProfileStore/);
    });

    it('imports auth-related SDK helpers for profile discovery', () => {
      expect(indexContent).toMatch(/from\s+['"]openclaw\/plugin-sdk\/provider-auth['"]/);
    });

    it('relies solely on providerAuthAliases for auth discovery', () => {
      // Check that catalog.run does not create new auth profiles
      expect(indexContent).not.toMatch(/upsertAuthProfile/);
    });
  });

  describe('wrapStreamFn registration', () => {
    it('registerProvider calls wrapStreamFn with imported wrapper', () => {
      expect(indexContent).toMatch(/wrapStreamFn:\s*\w+/);
    });

    it('imports wrapCloudflareUnifiedBillingStream from stream-wrappers', () => {
      expect(indexContent).toMatch(/from\s+['"]\.\/stream-wrappers\.js['"]/);
    });

    it('does NOT define inline wrapStreamFn function', () => {
      // After refactor, wrapStreamFn should reference imported function, not inline
      expect(indexContent).not.toMatch(/wrapStreamFn:\s*\(\s*ctx\s*\)\s*=>/);
    });
  });
});

describe('cloudflare-unified-billing manifest auth configuration', () => {
  const manifestPath = join(__dirname, '../openclaw.plugin.json');
  const manifestContent = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  describe('providerAuthAliases (kept)', () => {
    it('has providerAuthAliases mapping to cloudflare-ai-gateway', () => {
      expect(manifestContent.providerAuthAliases).toBeDefined();
      expect(manifestContent.providerAuthAliases['cloudflare-unified-billing']).toBe(
        'cloudflare-ai-gateway',
      );
    });

    it('providerAuthAliases enables profile sharing with bundled provider', () => {
      const alias = manifestContent.providerAuthAliases?.['cloudflare-unified-billing'];
      expect(alias).toBe('cloudflare-ai-gateway');

      // This means:
      // - openclaw onboard with --cloudflare-ai-gateway-api-key creates profile for cloudflare-ai-gateway
      // - cloudflare-unified-billing catalog.run discovers that profile via alias
      // - No separate auth registration needed
    });
  });

  describe('providerAuthChoices removal', () => {
    it('does NOT have providerAuthChoices array', () => {
      // After refactor, providerAuthChoices should be removed
      expect(manifestContent.providerAuthChoices).toBeUndefined();
    });

    it('relies only on alias, not separate auth choices', () => {
      // Check that no separate auth choice is defined
      expect(manifestContent.providerAuthChoices).not.toBeDefined();
    });
  });

  describe('providerAuthEnvVars (moved to setup.providers)', () => {
    it('no longer declares legacy providerAuthEnvVars', () => {
      expect(manifestContent.providerAuthEnvVars).toBeUndefined();
    });

    it('setup.providers covers the provider auth env var', () => {
      const providerSetup = manifestContent.setup?.providers?.[0];
      expect(providerSetup?.envVars).toContain('CLOUDFLARE_AI_GATEWAY_API_KEY');
    });
  });

  describe('setup.providers (kept for hints)', () => {
    it('has setup.providers with env var hints', () => {
      expect(manifestContent.setup?.providers).toBeDefined();
      expect(manifestContent.setup?.providers?.length).toBeGreaterThan(0);
    });

    it('setup.providers lists required env vars', () => {
      const providerSetup = manifestContent.setup?.providers?.[0];
      expect(providerSetup?.id).toBe('cloudflare-unified-billing');
      expect(providerSetup?.envVars).toBeDefined();
      expect(providerSetup?.envVars).toContain('CLOUDFLARE_AI_GATEWAY_API_KEY');
      expect(providerSetup?.envVars).toContain('CLOUDFLARE_API_TOKEN');
      expect(providerSetup?.envVars).toContain('CF_AI_GATEWAY_ACCOUNT_ID');
      expect(providerSetup?.envVars).toContain('CF_AI_GATEWAY_GATEWAY_ID');
    });

    it('setup.providers does NOT require runtime', () => {
      const providerSetup = manifestContent.setup?.providers?.[0];
      expect(providerSetup?.requiresRuntime).toBe(false);
    });
  });

  describe('modelSupport (kept for auto-loading)', () => {
    it('has modelSupport with modelPrefixes', () => {
      expect(manifestContent.modelSupport).toBeDefined();
      expect(manifestContent.modelSupport?.modelPrefixes).toBeDefined();
      expect(Array.isArray(manifestContent.modelSupport?.modelPrefixes)).toBe(true);
    });

    it('modelPrefixes include all supported providers', () => {
      const prefixes = manifestContent.modelSupport?.modelPrefixes || [];
      expect(prefixes).toContain('google/');
      expect(prefixes).toContain('anthropic/');
      expect(prefixes).toContain('openai/');
    });

    it('modelPrefixes enable auto-loading without runtime', () => {
      // When user selects model like "openai/gpt-5.2", plugin loads from prefix
      const prefixes = manifestContent.modelSupport?.modelPrefixes || [];
      expect(prefixes.length).toBeGreaterThan(0);
    });
  });
});

describe('cloudflare-unified-billing auth discovery flow', () => {
  const indexPath = join(__dirname, 'index.ts');
  const indexContent = readFileSync(indexPath, 'utf-8');

  describe('catalog auth discovery via alias', () => {
    it('catalog checks cloudflare-ai-gateway provider ID for profiles', () => {
      // Catalog should list profiles for both provider IDs
      expect(indexContent).toMatch(/listProfilesForProvider/);
    });

    it('catalog uses ALIASED_PROVIDER constant for discovery', () => {
      expect(indexContent).toMatch(/ALIASED_PROVIDER\s*=\s*['"]cloudflare-ai-gateway['"]/);
    });

    it('catalog checks providerIdsToCheck array', () => {
      expect(indexContent).toMatch(/providerIdsToCheck\s*=\s*\[/);
      expect(indexContent).toMatch(/PROVIDER_ID,\s*ALIASED_PROVIDER/);
    });
  });

  describe('env var fallback when profile not found', () => {
    it('catalog keeps envApiKey as a legacy fallback when no profile is found', () => {
      const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envApiKey\)/);
    });

    it('catalog uses envAccountId and envGatewayId fallbacks', () => {
      const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envAccountId\)/);
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envGatewayId\)/);
    });

    it('env vars allow operation without auth profiles', () => {
      const indexContent = readFileSync(indexPath, 'utf-8');
      // Check that catalog returns provider even when credential is undefined
      expect(indexContent).toMatch(
        /if\s*\(\s*\(envAccountId\s*&&\s*envGatewayId\)\s*\|\|\s*usingAccess\s*\)/,
      );
    });
  });
});
