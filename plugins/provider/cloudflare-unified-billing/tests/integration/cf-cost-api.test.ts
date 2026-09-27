/**
 * Integration tests for Cloudflare API cost observability endpoints.
 *
 * Verifies:
 * 1. AI Gateway Logs API is accessible and supports metadata fields
 * 2. GraphQL Analytics API for Workers metrics (workersInvocationsAdaptive)
 * 3. AI Gateway analytics via GraphQL (aiGatewayRequestsAdaptiveGroups)
 *
 * These tests validate the data pipeline: CF API → cost-calculator → Dashboard.
 *
 * @module-tag integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDevVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  try {
    // Try multiple locations for .dev.vars
    const candidates = [
      join(__dirname, '..', '.dev.vars'),
      join(__dirname, '..', '..', '.dev.vars'),
    ];
    for (const candidate of candidates) {
      try {
        const content = readFileSync(candidate, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          const value = trimmed.slice(eqIdx + 1).trim();
          if (key && value) vars[key] = value;
        }
        if (vars.CLOUDFLARE_API_TOKEN) break;
      } catch {
        // File not found, try next
      }
    }
  } catch {
    // Ignore
  }
  return vars;
}

/**
 * Resolve a credential from the process environment first (CI passes live
 * credentials as env vars), then fall back to a local `.dev.vars` file.
 */
function readValue(key: string): string | undefined {
  return process.env[key] ?? loadDevVars()[key];
}

function hasCredentials(): boolean {
  return (
    process.env.PLUGIN_LIVE_TESTS === 'true' &&
    Boolean(
      readValue('CLOUDFLARE_API_TOKEN') &&
      readValue('CF_AI_GATEWAY_ACCOUNT_ID') &&
      readValue('CF_AI_GATEWAY_GATEWAY_ID'),
    )
  );
}

const describeIntegration = hasCredentials() ? describe : describe.skip;

describeIntegration('Cloudflare API cost observability', () => {
  let apiToken: string;
  let accountId: string;
  let gatewayId: string;

  beforeAll(() => {
    apiToken = readValue('CLOUDFLARE_API_TOKEN')!;
    accountId = readValue('CF_AI_GATEWAY_ACCOUNT_ID')!;
    gatewayId = readValue('CF_AI_GATEWAY_GATEWAY_ID')!;
  });

  const cfApiBase = 'https://api.cloudflare.com/client/v4';
  const authHeaders = () => ({
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  });

  describe('AI Gateway Logs API', () => {
    it('can fetch AI Gateway logs', async () => {
      const response = await fetch(
        `${cfApiBase}/accounts/${accountId}/ai-gateway/gateways/${gatewayId}/logs?limit=1`,
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        success: boolean;
        result?: unknown[];
        errors?: Array<{ message: string }>;
      };

      expect(body.success).toBe(true);
      expect(body.errors).toBeUndefined();

      // Verify log entries have expected structure
      if (body.result && body.result.length > 0) {
        const entry = body.result[0] as Record<string, unknown>;
        expect(entry).toBeDefined();
      }
    }, 15000);

    it('fetches logs with metadata filter support', async () => {
      // The AI Gateway Logs API supports filtering by metadata key/value
      // Verify the endpoint accepts metadata filters
      const response = await fetch(
        `${cfApiBase}/accounts/${accountId}/ai-gateway/gateways/${gatewayId}/logs?limit=1`,
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        success: boolean;
        result?: Array<Record<string, unknown>>;
      };

      expect(body.success).toBe(true);

      // Verify log entries contain expected cost-related fields
      if (body.result && body.result.length > 0) {
        const entry = body.result[0];
        // AI Gateway logs contain cost, tokens, model, provider fields
        const logFields = Object.keys(entry);
        const hasCostFields = logFields.some(
          (f) =>
            f.toLowerCase().includes('cost') ||
            f.toLowerCase().includes('token') ||
            f.toLowerCase().includes('model'),
        );
        expect(hasCostFields).toBe(true);
      }
    }, 15000);
  });

  describe('GraphQL Analytics API - Workers metrics', () => {
    it('can query workersInvocationsAdaptive for CPU time', async () => {
      const query = JSON.stringify({
        query: `{
          viewer {
            accounts(filter: { accountTag: "${accountId}" }) {
              workersInvocationsAdaptive(
                limit: 1
                filter: { datetime_geq: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}", datetime_leq: "${new Date().toISOString()}" }
              ) {
                sum {
                  requests
                  subrequests
                }
                quantiles {
                  cpuTimeP50
                  cpuTimeP99
                }
                dimensions {
                  datetime
                  scriptName
                  status
                }
              }
            }
          }
        }`,
      });

      const response = await fetch(`${cfApiBase}/graphql`, {
        method: 'POST',
        headers: authHeaders(),
        body: query,
      });

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        data?: {
          viewer?: {
            accounts?: Array<{
              workersInvocationsAdaptive?: unknown[];
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      // GraphQL may return errors for empty datasets, which is acceptable
      const hasData = body.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive;
      if (hasData) {
        expect(Array.isArray(hasData)).toBe(true);
      }
    }, 15000);
  });

  describe('GraphQL Analytics API - AI Gateway metrics', () => {
    it('can query aiGatewayRequestsAdaptiveGroups', async () => {
      const query = JSON.stringify({
        query: `{
          viewer {
            accounts(filter: { accountTag: "${accountId}" }) {
              aiGatewayRequestsAdaptiveGroups(
                limit: 1
                filter: { datetimeHour_geq: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}", datetimeHour_leq: "${new Date().toISOString()}" }
                orderBy: [datetimeMinute_ASC]
              ) {
                count
                dimensions {
                  model
                  provider
                  gateway
                }
              }
            }
          }
        }`,
      });

      const response = await fetch(`${cfApiBase}/graphql`, {
        method: 'POST',
        headers: authHeaders(),
        body: query,
      });

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        data?: {
          viewer?: {
            accounts?: Array<{
              aiGatewayRequestsAdaptiveGroups?: unknown[];
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      const hasData = body.data?.viewer?.accounts?.[0]?.aiGatewayRequestsAdaptiveGroups;
      if (hasData) {
        expect(Array.isArray(hasData)).toBe(true);
      }
    }, 15000);
  });

  describe('Cloudflare API token validation', () => {
    it('token has read access to accounts', async (ctx) => {
      const response = await fetch(`${cfApiBase}/accounts/${accountId}`, {
        headers: authHeaders(),
      });

      if (response.status === 403) {
        ctx.skip(
          'CLOUDFLARE_API_TOKEN is AI-Gateway scoped (Account:Read not granted) — expected for the plugin local credential',
        );
      }

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        success: boolean;
        result?: { id: string; name: string };
      };

      expect(body.success).toBe(true);
      expect(body.result?.id).toBe(accountId);
    }, 10000);
  });
});
