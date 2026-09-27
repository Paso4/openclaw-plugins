import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_GENERATION_PROVIDER_ID,
  WEB_FETCH_PROVIDER_ID,
  WEB_SEARCH_PROVIDER_ID,
} from './capabilities.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('cloudflare-unified-billing capability registration', () => {
  const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');
  const capabilitiesContent = readFileSync(join(__dirname, 'capabilities.ts'), 'utf-8');

  it('registers a web search provider', () => {
    expect(indexContent).toMatch(/registerWebSearchProvider\(/);
    expect(capabilitiesContent).toContain(WEB_SEARCH_PROVIDER_ID);
  });

  it('registers a web fetch provider', () => {
    expect(indexContent).toMatch(/registerWebFetchProvider\(/);
    expect(capabilitiesContent).toContain(WEB_FETCH_PROVIDER_ID);
  });

  it('registers an image generation provider', () => {
    expect(indexContent).toMatch(/registerImageGenerationProvider\(/);
    expect(capabilitiesContent).toContain(IMAGE_GENERATION_PROVIDER_ID);
  });
});

describe('cloudflare-unified-billing manifest capability contracts', () => {
  const pluginManifest = JSON.parse(
    readFileSync(join(__dirname, '..', 'openclaw.plugin.json'), 'utf-8'),
  ) as {
    contracts?: {
      imageGenerationProviders?: string[];
      webFetchProviders?: string[];
      webSearchProviders?: string[];
    };
  };

  it('declares web-search contract ownership', () => {
    expect(pluginManifest.contracts?.webSearchProviders).toContain(WEB_SEARCH_PROVIDER_ID);
  });

  it('declares web-fetch contract ownership', () => {
    expect(pluginManifest.contracts?.webFetchProviders).toContain(WEB_FETCH_PROVIDER_ID);
  });

  it('declares image-generation contract ownership', () => {
    expect(pluginManifest.contracts?.imageGenerationProviders).toContain(
      IMAGE_GENERATION_PROVIDER_ID,
    );
  });
});
