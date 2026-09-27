/**
 * @module-tag integration
 *
 * Per-provider connectivity smoke tests.
 *
 * One cheap model per provider family validates that the full
 * auth → baseUrl → CF AI Gateway /compat → provider pipeline works.
 * These tests run as part of the standard smoke suite (no extra env flag needed).
 *
 * Skipped when canRunTests() is false (no CLI or credentials).
 */

// Load env vars BEFORE any other imports
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const testDir = dirname(fileURLToPath(import.meta.url));
const devVarsPath = resolve(testDir, '../../.dev.vars');

if (existsSync(devVarsPath)) {
  const content = readFileSync(devVarsPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

import { describe, it, expect, beforeAll } from 'vitest';
import {
  canRunTests,
  prepareTestEnvironment,
  runInferModelAsync,
  assertProviderResult,
  PROVIDER_SMOKE_MODELS,
} from './utils.js';

let runTests: boolean | undefined;
function getRunTests(): boolean {
  if (runTests === undefined) runTests = canRunTests();
  return runTests;
}

beforeAll(() => {
  if (!getRunTests()) {
    console.log('Skipping provider smoke tests: openclaw CLI or credentials not available');
    return;
  }
  if (!prepareTestEnvironment()) {
    console.log('WARN: Could not start gateway - provider smoke tests may fail');
  }
}, 60000);

describe.skipIf(!getRunTests())(
  'cloudflare-unified-billing — per-provider connectivity smoke tests',
  () => {
    for (const [family, modelId] of Object.entries(PROVIDER_SMOKE_MODELS)) {
      it.concurrent(`${family}: ${modelId} routes through CF AI Gateway and returns a response`, async () => {
        const result = await runInferModelAsync(modelId, 'Reply with exactly: pong');
        assertProviderResult(result, modelId);
        expect(result.outputs[0].text).toMatch(/pong|ok|hi|hello/i);
      }, 90000);
    }
  },
);
