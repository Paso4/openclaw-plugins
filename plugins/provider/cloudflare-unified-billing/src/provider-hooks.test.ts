import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PROVIDER_ID } from './models.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('normalizeResolvedModel hook', () => {
  const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

  it('hook is defined in registerProvider', () => {
    expect(indexContent).toMatch(/normalizeResolvedModel:\s*\(/);
  });

  it('resolves auth from auth profiles', () => {
    expect(indexContent).toMatch(/ensureAuthProfileStore/);
    expect(indexContent).toMatch(/listProfilesForProvider/);
    expect(indexContent).toMatch(/authStore\.profiles\[profileId\]/);
  });

  it('checks both PROVIDER_ID and ALIASED_PROVIDER', () => {
    expect(indexContent).toMatch(/PROVIDER_ID,\s*ALIASED_PROVIDER/);
  });

  it('extracts accountId, gatewayId, and the profile key from profile metadata', () => {
    expect(indexContent).toMatch(/profile\.metadata\?.accountId/);
    expect(indexContent).toMatch(/profile\.metadata\?.gatewayId/);
    expect(indexContent).toMatch(/profile\.key/);
  });

  it('constructs baseUrl using resolveBaseUrl helper', () => {
    expect(indexContent).toMatch(
      /resolveBaseUrl\(\{\s*accountId,\s*gatewayId,\s*customDomain\s*\}\)/,
    );
  });

  it('builds auth headers through the shared gateway helper', () => {
    expect(indexContent).toMatch(/buildGatewayAuthHeaders\(\{/);
    expect(indexContent).toMatch(/apiToken:\s*authToken/);
  });

  it('supports a custom domain and Cloudflare Access', () => {
    expect(indexContent).toMatch(/CUSTOM_DOMAIN_ENV_VAR/);
    expect(indexContent).toMatch(/readAccessCredentials/);
  });

  it('falls back to config baseUrl/headers if no profiles found', () => {
    expect(indexContent).toMatch(/providerConfig\?.baseUrl/);
    expect(indexContent).toMatch(/providerConfig\?.headers/);
  });

  it('uses agentDir for auth profile resolution', () => {
    expect(indexContent).toMatch(/ctx\.agentDir/);
  });

  it('logs warning when agentDir not available', () => {
    expect(indexContent).toMatch(/log\.warn/);
    expect(indexContent).toMatch(/No agentDir available/);
  });

  it('returns modified model object', () => {
    expect(indexContent).toMatch(/return\s+model/);
  });

  it('logs normalization actions', () => {
    expect(indexContent).toMatch(/log\.info/);
    expect(indexContent).toMatch(/normalizeResolvedModel/);
  });

  it('logs auth resolution source', () => {
    expect(indexContent).toMatch(/Resolved auth from profile/);
    expect(indexContent).toMatch(/Using baseUrl from provider config/);
  });
});

describe('resolveDynamicModel hook', () => {
  const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

  it('hook is defined in registerProvider', () => {
    expect(indexContent).toMatch(/resolveDynamicModel:\s*\(/);
  });

  it('returns empty baseUrl to inherit from normalizeResolvedModel', () => {
    expect(indexContent).toMatch(/baseUrl:\s*['"]['"]/);
  });

  it('trims modelId', () => {
    expect(indexContent).toMatch(/modelId\.trim\(\)/);
  });

  it('returns undefined for empty modelId', () => {
    expect(indexContent).toMatch(/if\s*\(\s*!modelId\s*\)\s*return\s*undefined/);
  });

  it('looks up model in ALL_MODELS', () => {
    expect(indexContent).toMatch(/ALL_MODELS\.find/);
  });

  it('returns model with correct provider and api', () => {
    expect(indexContent).toMatch(/provider:\s*PROVIDER_ID/);
    expect(indexContent).toMatch(/api:\s*['"]openai-completions['"]/);
  });

  it('returns defaults for unknown models', () => {
    expect(indexContent).toMatch(/reasoning:\s*.*\?\?\s*false/);
    expect(indexContent).toMatch(/input:\s*.*\?\?\s*\['text'\]/);
    expect(indexContent).toMatch(/contextWindow:\s*.*\?\?\s*128000/);
  });

  it('logs dynamic model resolution', () => {
    expect(indexContent).toMatch(/log\.info/);
    expect(indexContent).toMatch(/resolveDynamicModel/);
  });
});
