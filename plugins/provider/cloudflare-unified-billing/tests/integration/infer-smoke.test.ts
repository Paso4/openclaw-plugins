/**
 * @module-tag integration
 */

// Load env vars BEFORE any other imports
import { readFileSync, existsSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Manually parse and set env vars from .dev.vars file
const testDir = dirname(fileURLToPath(import.meta.url));
const devVarsPath = resolve(testDir, '../../.dev.vars');

console.log('Loading env vars from:', devVarsPath);
console.log('File exists:', existsSync(devVarsPath));

if (existsSync(devVarsPath)) {
  const content = readFileSync(devVarsPath, 'utf-8');
  const lines = content.split('\n');
  for (const line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse KEY=value format (handle leading spaces in key)
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Set env var if not already set
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

console.log('CLOUDFLARE_AI_GATEWAY_API_KEY:', process.env.CLOUDFLARE_AI_GATEWAY_API_KEY);
console.log('CF_AI_GATEWAY_ACCOUNT_ID:', process.env.CF_AI_GATEWAY_ACCOUNT_ID);
console.log('CF_AI_GATEWAY_GATEWAY_ID:', process.env.CF_AI_GATEWAY_GATEWAY_ID);

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import { join } from 'path';
import {
  PROVIDER_ID,
  canRunTests,
  prepareTestEnvironment,
  isSmokeOnly,
  shouldRunReasoningTests,
  shouldRunVisionTests,
  runInferModelAsync,
  runInferVisionAsync,
  createTestImage,
  assertProviderResult,
  buildSubprocessEnv,
  SMOKE_MODELS,
  FULL_MODELS,
  REASONING_MODELS,
  VISION_MODELS,
  DYNAMIC_MODELS,
} from './utils.js';

const PLUGIN_DIR = join(import.meta.dirname, '..', '..');

function hasAuthProfile(provider: string): boolean {
  try {
    const result = execSync(`openclaw models auth list --provider "${provider}" --json`, {
      encoding: 'utf-8',
      timeout: 10000,
      env: buildSubprocessEnv(),
    });
    const profiles = JSON.parse(result).profiles || [];
    return profiles.length > 0;
  } catch {
    return false;
  }
}

function runOnboard(): void {
  console.log('--- Onboard Setup ---');

  // OpenClaw 2026.8.2 performs its own strict auth lookup by exact provider id
  // when running inference, so a profile must exist for the
  // cloudflare-unified-billing provider itself. Onboard only creates one for
  // the bundled cloudflare-ai-gateway provider (which the plugin aliases in
  // its catalog hooks but the host auth layer does not).
  const apiKey = process.env.CLOUDFLARE_AI_GATEWAY_API_KEY;
  const accountId = process.env.CF_AI_GATEWAY_ACCOUNT_ID;
  const gatewayId = process.env.CF_AI_GATEWAY_GATEWAY_ID;

  if (hasAuthProfile(PROVIDER_ID)) {
    console.log(`${PROVIDER_ID} auth profile already exists ✓`);
    return;
  }

  // Check if cloudflare-ai-gateway auth profile already exists
  if (hasAuthProfile('cloudflare-ai-gateway')) {
    console.log('cloudflare-ai-gateway auth profile already exists ✓');
  } else {
    // Need to run onboard to create auth profile
    console.log('Running openclaw onboard to create auth profile...');

    if (!apiKey || !accountId || !gatewayId) {
      console.log('WARN: Missing AI Gateway credentials - skipping onboard');
      return;
    }

    try {
      execSync(
        `openclaw onboard --non-interactive --accept-risk \
        --mode local \
        --auth-choice cloudflare-ai-gateway-api-key \
        --cloudflare-ai-gateway-account-id "${accountId}" \
        --cloudflare-ai-gateway-gateway-id "${gatewayId}" \
        --cloudflare-ai-gateway-api-key "${apiKey}" \
        --gateway-port 18789 \
        --gateway-bind lan \
        --skip-channels \
        --skip-skills \
        --skip-health`,
        {
          encoding: 'utf-8',
          timeout: 30000,
          stdio: 'inherit',
          env: buildSubprocessEnv(),
        },
      );
      console.log('Onboard completed ✓');

      // Verify auth profile was created
      if (!hasAuthProfile('cloudflare-ai-gateway')) {
        console.log('WARN: Auth profile creation may have failed');
      }
    } catch (error) {
      console.log('WARN: Onboard failed - proceeding anyway:', error);
    }
  }

  // Register the same API key under the cloudflare-unified-billing provider id
  // so the host auth lookup resolves it. In automation the key is piped on
  // stdin (see `openclaw models auth` docs) to keep it out of process lists.
  if (!apiKey) {
    console.log('WARN: Missing AI Gateway API key - skipping unified-billing auth profile');
    return;
  }

  console.log(`Creating ${PROVIDER_ID} auth profile...`);
  const paste = spawnSync(
    'openclaw',
    ['models', 'auth', 'paste-api-key', '--provider', PROVIDER_ID],
    {
      input: `${apiKey}\n`,
      encoding: 'utf-8',
      timeout: 15000,
      env: buildSubprocessEnv(),
    },
  );

  if (paste.status !== 0) {
    console.log(
      `WARN: paste-api-key failed (status ${paste.status}): ${paste.stderr || paste.stdout}`,
    );
  } else if (hasAuthProfile(PROVIDER_ID)) {
    console.log(`${PROVIDER_ID} auth profile created ✓`);
  } else {
    console.log('WARN: unified-billing auth profile not visible after paste-api-key');
  }
}

function checkPluginInstalled(): boolean {
  try {
    const result = execSync('openclaw plugins list --json', {
      encoding: 'utf-8',
      timeout: 10000,
      env: buildSubprocessEnv(),
    });
    const plugins = JSON.parse(result).plugins || [];
    const plugin = plugins.find((p: { id: string; enabled?: boolean }) => p.id === PROVIDER_ID);
    return plugin?.enabled === true;
  } catch {
    return false;
  }
}

function cleanNodeModules(): void {
  const nmPath = join(PLUGIN_DIR, 'node_modules');
  if (existsSync(nmPath)) {
    console.log('Cleaning node_modules to prevent OpenClaw security scan failure on symlinks...');
    rmSync(nmPath, { recursive: true, force: true });
  }
}

function installPlugin(): void {
  console.log('--- Plugin Setup ---');

  if (checkPluginInstalled()) {
    console.log(`Plugin ${PROVIDER_ID} already installed and enabled ✓`);
    return;
  }

  // Remove node_modules symlinks before install to avoid OpenClaw security scan failures
  cleanNodeModules();

  console.log(`Installing plugin from ${PLUGIN_DIR} ...`);

  try {
    // OpenClaw 2026.8.2 requires explicit capability consent for
    // non-interactive plugin installs (`--accept-capabilities`); without it
    // the install fails with "requires capability consent".
    execSync(`openclaw plugins install "${PLUGIN_DIR}" --force --accept-capabilities`, {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: 'inherit',
      env: buildSubprocessEnv(),
    });
    console.log('Plugin installed ✓');

    if (!checkPluginInstalled()) {
      console.log(`Enabling plugin ${PROVIDER_ID} ...`);
      execSync(`openclaw plugins enable "${PROVIDER_ID}" --accept-capabilities`, {
        encoding: 'utf-8',
        timeout: 10000,
        stdio: 'inherit',
        env: buildSubprocessEnv(),
      });
      console.log('Plugin enabled ✓');
    }

    // Verify runtime registration
    console.log('Verifying runtime registration ...');
    const inspectResult = execSync(`openclaw plugins inspect "${PROVIDER_ID}" --runtime --json`, {
      encoding: 'utf-8',
      timeout: 30000,
      env: buildSubprocessEnv(),
    }).trim();

    console.log(`Inspect stdout: ${JSON.stringify(inspectResult)}`);

    // Handle empty output gracefully - plugin may still work even if runtime inspection fails
    if (!inspectResult) {
      console.log(
        'WARN: Runtime inspection returned empty output - plugin may not be fully registered in runtime',
      );
      return;
    }

    try {
      const inspect = JSON.parse(inspectResult);
      if (inspect.providers?.some((p: { id: string }) => p.id === PROVIDER_ID)) {
        console.log('Provider registered in runtime ✓');
      } else {
        console.log('WARN: Provider not found in runtime inspection');
      }
    } catch (parseError) {
      console.log('WARN: Could not parse runtime inspection output - continuing anyway');
    }
  } catch (error) {
    console.error('ERROR: Plugin installation failed:', error);
    throw error;
  }
}

// Skip all tests if openclaw CLI or credentials not available
// Lazy evaluation - computed at test runtime, not import time
let runTests: boolean | undefined;

function getRunTests(): boolean {
  if (runTests === undefined) {
    runTests = canRunTests();
  }
  return runTests;
}

// Test image for vision tests
let testImage: { path: string; cleanup: () => void } | null = null;

// Increase timeout for beforeAll since plugin installation can take 30+ seconds
beforeAll(() => {
  if (!canRunTests()) {
    console.log('Skipping plugin setup: openclaw CLI or credentials not available');
    return;
  }

  // Run onboard FIRST to create auth profiles (before gateway starts)
  runOnboard();

  // Ensure gateway is running (will load bundled plugins)
  if (!prepareTestEnvironment()) {
    console.log('WARN: Could not start gateway - tests may fail');
  } else {
    console.log('Gateway started ✓');
  }

  // Install and enable plugin
  installPlugin();

  // Plugin is already loaded in gateway via catalog hook - no restart needed
  // The cloudflare-unified-billing plugin's normalizeResolvedModel hook
  // resolves auth from profiles in agentDir at runtime
  console.log('Plugin loaded via catalog hook - no restart needed ✓');

  if (shouldRunVisionTests()) {
    testImage = createTestImage();
  }
}, 120000); // 120 second timeout

afterAll(() => {
  if (testImage) {
    testImage.cleanup();
  }
});

describe.skipIf(!getRunTests())('cloudflare-unified-billing infer integration tests', () => {
  describe('smoke tests (cheap/fast models)', () => {
    for (const modelId of SMOKE_MODELS) {
      it.concurrent(`runs ${modelId}`, async () => {
        const result = await runInferModelAsync(modelId);
        assertProviderResult(result, modelId);
        expect(result.outputs[0].text).toMatch(/pong|ok|hi|hello/i);
      }, 60000);
    }
  });

  describe.skipIf(isSmokeOnly())('additional models', () => {
    for (const modelId of FULL_MODELS) {
      it.concurrent(`runs ${modelId}`, async () => {
        const result = await runInferModelAsync(modelId);
        assertProviderResult(result, modelId);
      }, 60000);
    }
  });

  describe.skipIf(!shouldRunReasoningTests())('reasoning models', () => {
    for (const modelId of REASONING_MODELS) {
      it.concurrent(`runs ${modelId} with reasoning`, async () => {
        const result = await runInferModelAsync(modelId, 'What is 2+2? Think briefly and answer.');
        assertProviderResult(result, modelId);
        // Reasoning models should provide a numeric answer
        expect(result.outputs[0].text).toMatch(/4|four/i);
      }, 60000);
    }
  });

  describe.skipIf(!shouldRunVisionTests() || !testImage)('vision models', () => {
    for (const modelId of VISION_MODELS) {
      it.concurrent(`runs ${modelId} with image input`, async () => {
        const result = await runInferVisionAsync(modelId, testImage!.path);
        assertProviderResult(result, modelId);
        // Vision models should describe the image (even minimal PNG)
        expect(result.outputs[0].text.length).toBeGreaterThan(0);
      }, 60000);
    }
  });

  describe.skipIf(isSmokeOnly())('dynamic model resolution', () => {
    for (const modelId of DYNAMIC_MODELS) {
      it.concurrent(`accepts unknown model ID ${modelId}`, async () => {
        const result = await runInferModelAsync(modelId);
        // OpenClaw 2026.8.2 emits the full --json envelope (provider/capability/…)
        // only for successful runs; failures throw and surface a minimal
        // { ok: false, error } payload without provider metadata. An unknown
        // model therefore always fails, so the old
        // `result.provider === PROVIDER_ID` assertion can no longer pass.
        // What matters is that the plugin's resolveDynamicModel accepted the
        // ID and the request reached the provider layer instead of being
        // rejected by host-side model resolution — visible in the error text.
        console.info(`Dynamic model result: ${JSON.stringify(result)}`);
        expect(result.ok).toBe(false);
        const errText = JSON.stringify(result.error ?? {});
        expect(errText).toContain(PROVIDER_ID);
        expect(errText).toContain(modelId);
      }, 60000);
    }
  });

  describe.skipIf(isSmokeOnly())('provider contract validation', () => {
    it.concurrent('response has correct capability', async () => {
      const result = await runInferModelAsync('google/gemini-3.1-flash-lite');
      expect(result.capability).toBe('model.run');
    }, 60000);

    it.concurrent('transport is local by default', async () => {
      const result = await runInferModelAsync('google/gemini-3.1-flash-lite');
      expect(result.transport).toBe('local');
    }, 60000);

    it.concurrent('attempts array is present', async () => {
      const result = await runInferModelAsync('google/gemini-3.1-flash-lite');
      expect(result.attempts).toBeDefined();
      expect(Array.isArray(result.attempts)).toBe(true);
    }, 60000);

    it.concurrent('outputs array has at least one entry', async () => {
      const result = await runInferModelAsync('google/gemini-3.1-flash-lite');
      expect(result.outputs).toBeDefined();
      expect(result.outputs.length).toBeGreaterThan(0);
      expect(result.outputs[0].text).toBeDefined();
      expect(result.outputs[0].mediaUrl).toBeDefined();
    }, 60000);
  });

  describe.skipIf(isSmokeOnly())('error handling', () => {
    it('handles empty prompt gracefully', () => {
      // openclaw infer rejects empty prompts before provider call
      // We can't test this directly as it fails CLI validation
      // This is a placeholder for future error handling tests
    });
  });
});

describe.skipIf(!getRunTests() || isSmokeOnly())(
  'cloudflare-unified-billing model catalog validation',
  () => {
    it.concurrent('all smoke models are in catalog', async () => {
      const { ALL_MODELS } = await import('../../src/models.js');
      const catalogIds = ALL_MODELS.map((m) => m.id);

      for (const modelId of SMOKE_MODELS) {
        expect(catalogIds).toContain(modelId);
      }
    });

    it.concurrent('reasoning models have reasoning flag', async () => {
      const { ALL_MODELS } = await import('../../src/models.js');

      for (const modelId of REASONING_MODELS) {
        const model = ALL_MODELS.find((m) => m.id === modelId);
        expect(model?.reasoning).toBe(true);
      }
    });

    it.concurrent('vision models support image input', async () => {
      const { ALL_MODELS } = await import('../../src/models.js');

      for (const modelId of VISION_MODELS) {
        const model = ALL_MODELS.find((m) => m.id === modelId);
        expect(model?.input).toContain('image');
      }
    });
  },
);
