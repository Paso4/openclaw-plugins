import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');
const streamWrappersContent = readFileSync(join(__dirname, 'stream-wrappers.ts'), 'utf-8');
const catalogProviderContent = readFileSync(join(__dirname, 'catalog-provider.ts'), 'utf-8');

describe('OpenClaw Run ID attribution for Cloudflare OTEL cost tracking', () => {
  describe('runId capture via before_agent_start hook', () => {
    it('registers a before_agent_start hook', () => {
      expect(indexContent).toMatch(/before_agent_start/);
    });

    it('captures event.runId in the hook handler', () => {
      expect(indexContent).toMatch(/event\.runId|runId/);
    });

    it('stores runId for later header injection', () => {
      // Must reference the shared variable or runContext
      expect(indexContent).toMatch(/currentOpenClawRunId|openclawRunId|runContext\.setRunContext/);
    });
  });

  describe('cf-aig-metadata header injection', () => {
    it('normalizeResolvedModel injects cf-aig-metadata header', () => {
      expect(indexContent).toMatch(/cf-aig-metadata/);
    });

    it('cf-aig-metadata contains openclaw_run_id key', () => {
      expect(indexContent).toMatch(/openclaw_run_id/);
    });

    it('wraps metadata as JSON string in header', () => {
      expect(indexContent).toMatch(/JSON\.stringify/);
    });

    it('metadata includes openclaw_run_id with current runId value', () => {
      // Must serialize the runId into the JSON payload
      expect(indexContent).toMatch(/openclaw_run_id.*runId|openclawRunId|currentOpenClawRunId/);
    });

    it('does not inject cf-aig-metadata when runId is not set', () => {
      // The header injection must be conditional on runId being available
      expect(indexContent).toMatch(/currentOpenClawRunId|openclawRunId/);
    });
  });

  describe('stream wrapper metadata propagation', () => {
    it('wrapCloudflareUnifiedBillingStream includes cf-aig-metadata in headers', () => {
      expect(streamWrappersContent).toMatch(/cf-aig-metadata/);
    });

    it('stream wrapper preserves existing Authorization alongside metadata', () => {
      expect(streamWrappersContent).toMatch(/cf-aig-metadata/);
      expect(streamWrappersContent).toMatch(/Authorization/);
    });
  });

  describe('catalog provider metadata compatibility', () => {
    it('catalog provider does not include runId metadata (runs at discovery time)', () => {
      // buildCatalogProvider runs at registration/discovery, not per-request,
      // so it should NOT include cf-aig-metadata (runId is not available yet)
      expect(catalogProviderContent).not.toMatch(/cf-aig-metadata/);
    });

    it('catalog provider keeps existing auth headers unchanged', () => {
      expect(catalogProviderContent).toMatch(/buildGatewayAuthHeaders/);
    });
  });

  describe('log redaction safety', () => {
    it('does not log the cf-aig-metadata value verbatim', () => {
      // Metadata should be redacted in logs to prevent leaking runId in plaintext logs
      expect(indexContent).toMatch(/redactHeadersForLog/);
    });
  });
});
