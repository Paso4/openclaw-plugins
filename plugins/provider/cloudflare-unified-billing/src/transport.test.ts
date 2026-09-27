import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('cloudflare-unified-billing transport configuration', () => {
  const catalogContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');
  const modelsContent = readFileSync(join(__dirname, 'models.ts'), 'utf-8');
  const accessContent = readFileSync(join(__dirname, 'access.ts'), 'utf-8');

  describe('headers for Cloudflare Gateway auth', () => {
    it('catalog provider builds auth headers through the shared helper', () => {
      expect(catalogContent).toMatch(/buildGatewayAuthHeaders/);
      expect(catalogContent).toMatch(/apiToken:\s*cfToken/);
    });

    it('gateway auth helper sets a Bearer Authorization header', () => {
      expect(accessContent).toMatch(/Authorization\s*=\s*`Bearer \$\{params\.apiToken\}`/);
    });

    it('gateway auth helper sets cf-aig-gateway-id header for gateway routing', () => {
      expect(accessContent).toMatch(/['"]cf-aig-gateway-id['"]\]\s*=\s*params\.gatewayId/);
    });

    it('catalog provider does not set x-api-key header', () => {
      expect(catalogContent).not.toMatch(/x-api-key:\s*['"]/);
    });

    it('header includes Bearer prefix', () => {
      expect(accessContent).toMatch(/Bearer \$\{params\.apiToken\}/);
    });
  });

  describe('API transport type', () => {
    it('catalog provider uses openai-completions api', () => {
      expect(catalogContent).toMatch(/api:\s*['"]openai-completions['"]\s*as\s*const/);
    });

    it('catalog provider not native Anthropic messages api', () => {
      expect(catalogContent).not.toMatch(/anthropic-messages/);
    });
  });

  describe('baseUrl configuration', () => {
    it('baseUrl targets the REST API ai/v1 path', () => {
      const urlMatch = modelsContent.match(/return\s*`[^`]*\/ai\/v1`/);
      expect(urlMatch).not.toBeNull();
    });

    it('baseUrl not anthropic suffix', () => {
      expect(modelsContent).not.toMatch(/\/anthropic['"`]/);
    });

    it('baseUrl format includes account in REST API path', () => {
      expect(modelsContent).toMatch(
        /api\.cloudflare\.com\/client\/v4\/accounts\/\$\{params\.accountId\}\/ai\/v1/,
      );
    });
  });

  describe('apiKey field absence', () => {
    it('catalog provider does not set apiKey field to a literal', () => {
      expect(catalogContent).not.toMatch(/apiKey:\s*['"]/);
    });

    it('catalog provider does not serialize credentials into logs', () => {
      expect(catalogContent).not.toMatch(/JSON\.stringify\(result/);
    });

    it('credentials passed via the shared gateway auth helper', () => {
      expect(catalogContent).toMatch(/headers:\s*buildGatewayAuthHeaders/);
      expect(accessContent).toMatch(/Authorization/);
    });
  });

  describe('transport distinct from cloudflare-ai-gateway', () => {
    it('unified-billing uses REST API ai/v1 endpoint', () => {
      expect(modelsContent).toMatch(/\/ai\/v1/);
    });

    it('unified-billing uses openai-completions api', () => {
      expect(catalogContent).toMatch(/api:\s*['"]openai-completions['"]/);
    });

    it('unified-billing uses Authorization header', () => {
      expect(accessContent).toMatch(/Authorization/);
    });
  });
});
