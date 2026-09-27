import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');
const modelsContent = readFileSync(join(__dirname, 'models.ts'), 'utf-8');

describe('cloudflare-unified-billing unified billing mode', () => {
  describe('catalog provider baseUrl for unified billing', () => {
    it('returns correct baseUrl format for unified billing endpoint', () => {
      expect(catalogContent).toMatch(/resolveBaseUrl\(\{/);
      expect(catalogContent).toMatch(/accountId,\s*gatewayId/);
    });

    it('baseUrl helper returns correct REST API endpoint', () => {
      const urlMatch = modelsContent.match(/return\s*`[^`]*\/ai\/v1`/);
      expect(urlMatch).not.toBeNull();
    });
  });

  describe('headers for unified billing', () => {
    it('catalog builds auth headers through the shared gateway helper', () => {
      expect(catalogContent).toMatch(/buildGatewayAuthHeaders\(\{/);
      expect(catalogContent).toMatch(/apiToken:\s*cfToken/);
      expect(catalogContent).toMatch(/gatewayId,/);
    });

    it('envApiToken is preferred for REST API authentication', () => {
      expect(catalogContent).toMatch(/normalizeOptionalString\(params\.envApiToken\)/);
    });

    it('custom domain routes through the /compat endpoint', () => {
      const accessContent = readFileSync(join(__dirname, 'access.ts'), 'utf-8');
      expect(accessContent).toMatch(/cf-access-token/);
      expect(modelsContent).toMatch(/\/compat/);
    });
  });
});
