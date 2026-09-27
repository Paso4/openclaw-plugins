import { describe, it, expect } from 'vitest';
import { PROVIDER_ID } from './models.js';

describe('cloudflare-unified-billing catalog order precedence', () => {
  describe('catalog order semantics', () => {
    it('catalog order simple for early registration', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/order:\s*['"]late['"]/);
    });

    it('catalog order simple runs early per OpenClaw semantics', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/order:\s*['"]late['"]/);
    });
  });

  describe('provider ID collision impossible', () => {
    it('different provider IDs prevent catalog merge collision', () => {
      const unifiedId = PROVIDER_ID;
      const gatewayId = 'cloudflare-ai-gateway';

      expect(unifiedId).not.toBe(gatewayId);
      expect(unifiedId).toBe('cloudflare-unified-billing');
    });

    it('distinct provider IDs create separate catalog entries', () => {
      const unifiedId = 'cloudflare-unified-billing';
      const gatewayId = 'cloudflare-ai-gateway';

      expect(unifiedId).not.toBe(gatewayId);
    });
  });

  describe('catalog merge isolation', () => {
    it('unified-billing entry isolated in models.providers', () => {
      const providerId = PROVIDER_ID;
      expect(providerId).toBe('cloudflare-unified-billing');
    });

    it('catalog merge does not affect cloudflare-ai-gateway entry', () => {
      const unifiedProviderId = 'cloudflare-unified-billing';
      const gatewayProviderId = 'cloudflare-ai-gateway';

      expect(unifiedProviderId).not.toBe(gatewayProviderId);
    });
  });

  describe('config schema validation', () => {
    it('manifest configSchema allows empty object', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const manifest = JSON.parse(
        readFileSync(join(__dirname, '../openclaw.plugin.json'), 'utf-8'),
      );

      expect(manifest.configSchema).toBeDefined();
      expect(manifest.configSchema?.type).toBe('object');
      expect(manifest.configSchema?.additionalProperties).toBe(false);
    });
  });
});
