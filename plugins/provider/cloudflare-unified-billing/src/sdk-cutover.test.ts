import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * OpenClaw 2026.11.7 session-controller cutover guard.
 *
 * 2026.11.7 removed three Plugin SDK surfaces with no compatibility alias
 * (docs/plugins/sdk-migration.md -> "Session-keyed harness registration",
 * "Gateway session control", "Agent turn start observation"):
 *
 *   1. session-keyed `setActiveEmbeddedRun(...)` registration now requires a
 *      host-admitted harness attempt (SESSION_CONTROLLER_ADMISSION_REQUIRED);
 *   2. `GatewayRequestHandlerOptions.context` no longer exposes the mutable
 *      `chatAbortControllers` / `chatQueuedTurns` maps (PLUGIN_CAPABILITY_REMOVED),
 *      replaced by `dispatchGatewayMethod` from
 *      `openclaw/plugin-sdk/gateway-method-runtime` plus the
 *      `contracts.gatewayMethodDispatch: ["authenticated-request"]` manifest contract;
 *   3. `AgentTurnStartOwner.observe()` returns `startDeadlineAtMs`; the old
 *      `expiresAtMs` property is gone.
 *
 * This provider plugin registers a model provider, its catalog, auth methods and
 * stream wrappers — none of those surfaces. These assertions pin that boundary so
 * a future change cannot reintroduce a removed capability silently.
 */

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(pluginRoot, 'src');

const manifest = JSON.parse(readFileSync(join(pluginRoot, 'openclaw.plugin.json'), 'utf-8')) as {
  contracts?: Record<string, unknown>;
};

function shippedSources(dir: string): Array<{ path: string; content: string }> {
  const out: Array<{ path: string; content: string }> = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...shippedSources(full));
      continue;
    }
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue;
    out.push({ path: full, content: readFileSync(full, 'utf-8') });
  }
  return out;
}

const sources = shippedSources(sourceRoot);

function references(symbol: string): string[] {
  return sources
    .filter(({ content }) => content.includes(symbol))
    .map(({ path }) => path.slice(pluginRoot.length + 1));
}

describe('OpenClaw 2026.11.7 session-controller cutover', () => {
  it('does not register session-keyed embedded runs (needs host-admitted runAttempt)', () => {
    expect(references('setActiveEmbeddedRun')).toEqual([]);
  });

  it('does not touch the removed mutable chat abort/queue maps', () => {
    expect(references('chatAbortControllers')).toEqual([]);
    expect(references('chatQueuedTurns')).toEqual([]);
  });

  it('does not consume the removed AgentTurnStartOwner.expiresAtMs observation', () => {
    const observing = sources.filter(({ content }) => content.includes('AgentTurnStartOwner'));
    expect(observing.map(({ path }) => path.slice(pluginRoot.length + 1))).toEqual([]);
  });

  it('declares no gatewayMethodDispatch contract (it registers no Gateway methods)', () => {
    expect(manifest.contracts?.gatewayMethodDispatch).toBeUndefined();
    expect(references('gateway-method-runtime')).toEqual([]);
  });
});
