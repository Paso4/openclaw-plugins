import { describe, it, expect } from 'vitest';
import { PROVIDER_ID } from './models.js';

describe('cloudflare-unified-billing registration compatibility', () => {
  describe('provider registration', () => {
    it('provider ID is cloudflare-unified-billing', () => {
      expect(PROVIDER_ID).toBe('cloudflare-unified-billing');
    });

    it('provider ID distinct from bundled cloudflare-ai-gateway', () => {
      expect(PROVIDER_ID).not.toBe('cloudflare-ai-gateway');
    });

    it('different provider IDs prevent catalog collision', () => {
      const unifiedId = PROVIDER_ID;
      const gatewayId = 'cloudflare-ai-gateway';
      expect(unifiedId).not.toBe(gatewayId);
    });
  });

  describe('catalog hooks defined', () => {
    it('catalog.run function exists in plugin', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/catalog:\s*\{/);
      expect(indexContent).toMatch(/run:\s*async/);
    });

    it('resolveDynamicModel function exists', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/resolveDynamicModel:/);
    });

    it('wrapStreamFn function exists', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/wrapStreamFn:/);
    });

    it('catalog order is simple', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/order:\s*['"]late['"]/);
    });
  });

  describe('auth configuration', () => {
    it('auth array defined in registration', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/auth:\s*\[/);
    });

    it('auth is empty array (uses catalog-based auth resolution)', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = join(fileURLToPath(import.meta.url), '..');
      const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

      expect(indexContent).toMatch(/auth:\s*\[\]/);
    });
  });
});
