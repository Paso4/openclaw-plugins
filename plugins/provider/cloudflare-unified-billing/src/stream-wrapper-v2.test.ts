import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('wrapCloudflareUnifiedBillingStream function structure', () => {
  const wrappersContent = readFileSync(join(__dirname, 'stream-wrappers.ts'), 'utf-8');

  it('function is exported', () => {
    expect(wrappersContent).toMatch(/export\s+function\s+wrapCloudflareUnifiedBillingStream/);
  });

  it('accepts ProviderWrapStreamFnContext parameter', () => {
    expect(wrappersContent).toMatch(/ctx:\s*ProviderWrapStreamFnContext/);
  });

  it('returns StreamFn or undefined', () => {
    expect(wrappersContent).toMatch(/StreamFn\s*\|\s*undefined/);
  });

  it('checks if ctx.streamFn exists', () => {
    expect(wrappersContent).toMatch(/if\s*\(\s*!ctx\.streamFn\s*\)/);
  });

  it('returns undefined not null', () => {
    expect(wrappersContent).toMatch(/return\s+undefined/);
    expect(wrappersContent).not.toMatch(/return\s+null/);
  });
});

describe('wrapCloudflareUnifiedBillingStream header injection', () => {
  const wrappersContent = readFileSync(join(__dirname, 'stream-wrappers.ts'), 'utf-8');

  it('creates wrapper function with model, context, options params', () => {
    expect(wrappersContent).toMatch(/return\s+async\s+\(model,\s*context,\s*options\)/);
  });

  it('merges headers into finalModel', () => {
    expect(wrappersContent).toMatch(/finalModel\s*=\s*\{/);
    expect(wrappersContent).toMatch(/\.\.\.model\.headers/);
  });

  it('calls inner streamFn with modified params', () => {
    expect(wrappersContent).toMatch(/return\s+inner\(finalModel,\s*context,\s*finalOptions\)/);
  });
});

describe('wrapCloudflareUnifiedBillingStream logging', () => {
  const wrappersContent = readFileSync(join(__dirname, 'stream-wrappers.ts'), 'utf-8');

  it('creates subsystem logger', () => {
    expect(wrappersContent).toMatch(
      /createSubsystemLogger\(['"]cloudflare-unified-billing\/stream-wrapper['"]\)/,
    );
  });

  it('logs wrapping information', () => {
    expect(wrappersContent).toMatch(/log\.(info|debug)\(/);
    expect(wrappersContent).toMatch(/Wrapping streamFn/);
  });

  it('logs modelId', () => {
    expect(wrappersContent).toMatch(/model\.id/);
  });

  it('logs baseUrl', () => {
    expect(wrappersContent).toMatch(/model\.baseUrl/);
  });

  it('logs hasAuthorization status', () => {
    expect(wrappersContent).toMatch(/hasAuthorization/);
    expect(wrappersContent).toMatch(/model\.headers\?\.Authorization/);
  });

  it('logs info for request headers', () => {
    expect(wrappersContent).toMatch(/log\.(info|debug)\(/);
    expect(wrappersContent).toMatch(/CF Unified Billing request/);
  });
});

describe('wrapCloudflareUnifiedBillingStream exports __testing', () => {
  const wrappersContent = readFileSync(join(__dirname, 'stream-wrappers.ts'), 'utf-8');

  it('does not export __testing (internal log only)', () => {
    expect(wrappersContent).not.toMatch(/export\s+const\s+__testing/);
  });

  it('log is private const', () => {
    expect(wrappersContent).toMatch(/const\s+log\s*=\s*createSubsystemLogger/);
  });
});

describe('wrapStreamFn registration in index.ts', () => {
  const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

  it('imports wrapCloudflareUnifiedBillingStream', () => {
    expect(indexContent).toMatch(
      /import\s+\{\s*wrapCloudflareUnifiedBillingStream\s*\}\s+from\s+['"]\.\/stream-wrappers\.js['"]/,
    );
  });

  it('registers wrapStreamFn with imported function', () => {
    expect(indexContent).toMatch(/wrapStreamFn:\s*wrapCloudflareUnifiedBillingStream/);
  });

  it('does NOT define inline wrapStreamFn', () => {
    expect(indexContent).not.toMatch(/wrapStreamFn:\s*\(\s*ctx\s*\)\s*=>/);
  });
});
