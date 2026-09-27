import { execSync, spawnSync, execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
import { writeFileSync, unlinkSync, mkdtempSync, existsSync, readdirSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export const PROVIDER_ID = 'cloudflare-unified-billing';

export interface InferResult {
  ok: boolean;
  capability: string;
  transport: string;
  provider: string;
  model: string;
  attempts: unknown[];
  outputs: { text: string; mediaUrl: string | null }[];
  error?: string;
}

export function hasOpenclawCLI(): boolean {
  try {
    execSync('openclaw --version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

export function hasCredentials(): boolean {
  return (
    Boolean(process.env.CLOUDFLARE_AI_GATEWAY_API_KEY) &&
    Boolean(process.env.CF_AI_GATEWAY_ACCOUNT_ID) &&
    Boolean(process.env.CF_AI_GATEWAY_GATEWAY_ID)
  );
}

/**
 * Check if OpenClaw gateway is running and accepting connections.
 * Integration tests require a running gateway to actually invoke models.
 */
export function hasRunningGateway(): boolean {
  try {
    const result = spawnSync('ss', ['-tln', '-H', 'sport', '=', ':18789'], {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return result.stdout?.includes(':18789') || false;
  } catch {
    try {
      const result = spawnSync('netstat', ['-tln'], {
        encoding: 'utf-8',
        timeout: 5000,
      });
      return result.stdout?.includes(':18789') || false;
    } catch {
      return false;
    }
  }
}

/**
 * Start the OpenClaw gateway if not already running.
 * Returns true if gateway is running after this call.
 */
export function ensureGatewayRunning(): boolean {
  if (hasRunningGateway()) {
    return true;
  }

  // Kill any existing gateway process first
  try {
    spawnSync('pkill', ['-f', 'openclaw gateway'], { timeout: 5000 });
  } catch {}

  // Start gateway in background using execSync with detached process
  try {
    execSync(
      'nohup openclaw gateway --port 18789 --allow-unconfigured --bind lan > /tmp/openclaw-gateway.log 2>&1 &',
      {
        timeout: 5000,
        stdio: 'ignore',
      },
    );
  } catch {}

  // Wait for gateway to be ready (up to 20 seconds)
  for (let i = 0; i < 20; i++) {
    if (hasRunningGateway()) {
      return true;
    }
    spawnSync('sleep', ['1'], { timeout: 5000 });
  }

  return false;
}

/**
 * Integration tests make live, paid calls against the Cloudflare AI Gateway.
 * They only run when explicitly opted in via `PLUGIN_LIVE_TESTS=true` so pull
 * requests and local unit runs never incur provider spend. The develop CI job
 * sets this variable; run it locally only when you intend to spend credits.
 */
export function liveTestsEnabled(): boolean {
  return process.env.PLUGIN_LIVE_TESTS === 'true';
}

/**
 * Integration tests require:
 * 1. explicit opt-in via PLUGIN_LIVE_TESTS
 * 2. openclaw CLI available
 * 3. Cloudflare AI Gateway credentials
 */
export function canRunTests(): boolean {
  return liveTestsEnabled() && hasOpenclawCLI() && hasCredentials();
}

/**
 * Ensures all prerequisites for running tests.
 * Starts gateway if needed.
 */
export function prepareTestEnvironment(): boolean {
  if (!canRunTests()) {
    return false;
  }
  return ensureGatewayRunning();
}

export function isSmokeOnly(): boolean {
  return process.env.SMOKE_TESTS_ONLY === 'true';
}

export function shouldRunReasoningTests(): boolean {
  return process.env.RUN_REASONING_TESTS === 'true' && !isSmokeOnly();
}

export function shouldRunVisionTests(): boolean {
  return process.env.RUN_VISION_TESTS === 'true' && !isSmokeOnly();
}

/**
 * Build a clean env for subprocess calls to openclaw.
 * Vitest sets VITEST=true which causes openclaw to suppress JSON output.
 * We strip vitest-specific env vars so openclaw behaves normally.
 */
export function buildSubprocessEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // openclaw suppresses output when VITEST is set
  delete env.VITEST;
  delete env.VITEST_WORKER_ID;
  delete env.VITEST_POOL_ID;
  delete env.TEST;
  return env;
}

export function runInferModel(
  modelId: string,
  prompt: string = 'Reply with exactly: pong',
): InferResult {
  const modelRef = `${PROVIDER_ID}/${modelId}`;
  console.info(`Running model ${modelRef} with prompt: ${prompt}\n`);
  const cmd = `openclaw infer model run --prompt "${prompt}" --model ${modelRef} --json`;

  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: buildSubprocessEnv(),
    });
    return JSON.parse(result);
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string; stderr?: string };
    // Try to parse stdout if available
    if (err.stdout) {
      return JSON.parse(err.stdout);
    }
    return {
      ok: false,
      capability: 'model.run',
      transport: 'local',
      provider: PROVIDER_ID,
      model: modelId,
      attempts: [],
      outputs: [],
      error: err.message || 'Unknown error',
    };
  }
}

export function runInferVision(modelId: string, imagePath: string): InferResult {
  const modelRef = `${PROVIDER_ID}/${modelId}`;
  console.info(`Running vision model ${modelRef} with image: ${imagePath}`);
  const cmd = `openclaw infer model run --prompt "Describe this image in one word" --file "${imagePath}" --model ${modelRef} --json`;

  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: buildSubprocessEnv(),
    });
    if (stdout) return JSON.parse(stdout);
    return JSON.parse(stdout);
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string };
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        // Fall through
      }
    }
    return {
      ok: false,
      capability: 'model.run',
      transport: 'local',
      provider: PROVIDER_ID,
      model: modelId,
      attempts: [],
      outputs: [],
      error: err.message || 'Unknown error',
    };
  }
}

// Minimal valid PNG (1x1 red pixel)
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

export function createTestImage(): { path: string; cleanup: () => void } {
  const tempDir = mkdtempSync(join(tmpdir(), 'infer-test-'));
  const imagePath = join(tempDir, 'test.png');
  writeFileSync(imagePath, Buffer.from(MINIMAL_PNG_BASE64, 'base64'));

  return {
    path: imagePath,
    cleanup: () => {
      try {
        if (existsSync(imagePath)) unlinkSync(imagePath);
        if (existsSync(tempDir)) {
          const files = readdirSync(tempDir);
          for (const file of files) {
            unlinkSync(join(tempDir, file));
          }
          rmdirSync(tempDir);
        }
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

/**
 * Assert that an InferResult is valid and matches the expected provider and model.
 */
export function assertProviderResult(result: InferResult, expectedModelId: string): void {
  console.info(`Result: ${JSON.stringify(result, null, 2)}`);
  if (!result.ok) {
    throw new Error(`Model run failed: ${result.error || 'Unknown error'}`);
  }
  if (result.provider !== PROVIDER_ID) {
    throw new Error(`Provider mismatch: expected ${PROVIDER_ID}, got ${result.provider}`);
  }
  if (result.model !== expectedModelId) {
    throw new Error(`Model mismatch: expected ${expectedModelId}, got ${result.model}`);
  }
  if (!result.outputs[0]?.text) {
    throw new Error(`Empty output text`);
  }
}

export async function runInferModelAsync(
  modelId: string,
  prompt: string = 'Reply with exactly: pong',
): Promise<InferResult> {
  const modelRef = `${PROVIDER_ID}/${modelId}`;
  console.info(`Running model ${modelRef} with prompt: ${prompt}\n`);

  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      ['infer', 'model', 'run', '--prompt', prompt, '--model', modelRef, '--json'],
      {
        encoding: 'utf-8',
        timeout: 60000,
        env: buildSubprocessEnv(),
      },
    );
    return JSON.parse(stdout);
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string; stderr?: string };
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        // Fall through
      }
    }
    return {
      ok: false,
      capability: 'model.run',
      transport: 'local',
      provider: PROVIDER_ID,
      model: modelId,
      attempts: [],
      outputs: [],
      error: err.message || 'Unknown error',
    };
  }
}

export async function runInferVisionAsync(
  modelId: string,
  imagePath: string,
): Promise<InferResult> {
  const modelRef = `${PROVIDER_ID}/${modelId}`;
  console.info(`Running vision model ${modelRef} with image: ${imagePath}`);

  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      [
        'infer',
        'model',
        'run',
        '--prompt',
        'Describe this image in one word',
        '--file',
        imagePath,
        '--model',
        modelRef,
        '--json',
      ],
      {
        encoding: 'utf-8',
        timeout: 60000,
        env: buildSubprocessEnv(),
      },
    );
    return JSON.parse(stdout);
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string };
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        // Fall through
      }
    }
    return {
      ok: false,
      capability: 'model.run',
      transport: 'local',
      provider: PROVIDER_ID,
      model: modelId,
      attempts: [],
      outputs: [],
      error: err.message || 'Unknown error',
    };
  }
}

export const SMOKE_MODELS = [
  // Use Gemini models - these support unified billing
  'google/gemini-3.1-flash-lite',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
];

/**
 * Cheapest/fastest smoke model per provider family, used for per-provider
 * connectivity validation tests. One model per family keeps CI costs low
 * while confirming the full auth → baseUrl → response pipeline works.
 *
 * Selection criteria: lowest input cost AND smallest context window requirement.
 */
export const PROVIDER_SMOKE_MODELS: Record<string, string> = {
  // Google — gemini-3.1-flash-lite: $0.075/M input, free-tier eligible
  google: 'google/gemini-3.1-flash-lite',

  // Google Vertex AI — flash-8b: $0.0375/M input
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // 'google-vertex-ai': 'google-vertex-ai/google/gemini-1.5-flash-8b',

  // Anthropic — claude-3-haiku: cheapest Anthropic model ($0.25/M input)
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // anthropic: 'anthropic/claude-3-haiku-20240307',

  // OpenAI — gpt-4.1-nano: $0.10/M input (cheapest GPT)
  openai: 'openai/gpt-4.1-nano',

  // xAI — grok-3-mini: cheapest Grok model
  // DISABLED: Grok models are not exposed by the CF AI Gateway REST API (404), so skip.

  // Groq — llama-3-8b: smallest / fastest Groq model
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // groq: 'groq/llama-3-8b-8192',

  // Mistral — mistral-nemo: cheapest Mistral chat model
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // mistral: 'mistral/mistral-nemo',

  // Cohere — command-light: smallest Cohere model
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // cohere: 'cohere/command-light',

  // Perplexity — sonar-small-chat: cheapest Perplexity model
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // perplexity: 'perplexity/sonar-small-chat',

  // Workers AI — phi-2: tiny Microsoft model, always free on Workers AI
  // DISABLED: workers-ai models don't return text via OpenAI-compat /compat endpoint (need native AI Gateway URL)
  // 'workers-ai': 'workers-ai/@cf/meta/llama-3-1-8b-instruct',

  // DeepSeek — deepseek-chat: lowest-cost DeepSeek model
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // deepseek: 'deepseek/deepseek-chat',

  // Cerebras — llama3-8b: smallest Cerebras model
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // cerebras: 'cerebras/llama3-8b',

  // Baseten — gpt-oss-4b: smallest Baseten model
  // DISABLED: no per-provider API key configured in CF AI Gateway (attempts: [])
  // baseten: 'baseten/openai/gpt-oss-4b',
};

export const FULL_MODELS = ['google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite'];

export const REASONING_MODELS = ['google/gemini-2.5-flash'];

export const VISION_MODELS = ['google/gemini-2.5-flash'];

export const DYNAMIC_MODELS = ['google/gemini-unknown-test-v1', 'google/gemini-unknown-test-v2'];
