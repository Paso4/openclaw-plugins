import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';
import type { OpenClawConfig } from 'openclaw/plugin-sdk/core';
import { customDomainFromBaseUrl, normalizeCustomDomain } from './models.js';
import {
  buildGatewayAuthHeaders,
  hasAccessCredentials,
  readAccessCredentials,
  type AccessCredentials,
} from './access.js';

type WebSearchProviderPlugin = Parameters<OpenClawPluginApi['registerWebSearchProvider']>[0];
type WebFetchProviderPlugin = Parameters<OpenClawPluginApi['registerWebFetchProvider']>[0];
type ImageGenerationProviderPlugin = Parameters<
  OpenClawPluginApi['registerImageGenerationProvider']
>[0];

const ENV_VAR = 'CLOUDFLARE_AI_GATEWAY_API_KEY';
const API_TOKEN_ENV_VAR = 'CLOUDFLARE_API_TOKEN';
const CUSTOM_DOMAIN_ENV_VAR = 'CF_AI_GATEWAY_CUSTOM_DOMAIN';
const REQUEST_TIMEOUT_MS = 30_000;

const CREDENTIAL_PATH_BASE = 'plugins.entries.cloudflare-unified-billing.config';
const WEB_SEARCH_CREDENTIAL_PATH = `${CREDENTIAL_PATH_BASE}.webSearch.cfAiGatewayApiKey`;
const WEB_FETCH_CREDENTIAL_PATH = `${CREDENTIAL_PATH_BASE}.webFetch.cfAiGatewayApiKey`;

export const WEB_SEARCH_PROVIDER_ID = 'cloudflare-ai-gateway-perplexity';
export const WEB_FETCH_PROVIDER_ID = 'cloudflare-ai-gateway-google';
export const IMAGE_GENERATION_PROVIDER_ID = 'cloudflare-ai-gateway-google-images';

const WEB_SEARCH_MODELS = [
  'perplexity/sonar',
  'perplexity/sonar-pro',
  'perplexity/sonar-pro-search',
  'perplexity/sonar-reasoning',
  'perplexity/sonar-reasoning-pro',
  'perplexity/sonar-deep-research',
] as const;

const WEB_FETCH_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'google/gemini-3-flash-preview',
  'perplexity/sonar-pro',
  'parallel/search',
] as const;

const IMAGE_GENERATION_MODELS = [
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image-preview',
] as const;

type UnifiedBillingRuntimeConfig = {
  baseUrl?: string;
  apiKey?: string;
  gatewayId?: string;
  customDomain?: string;
  access?: AccessCredentials;
};

type UnifiedBillingProviderConfig = {
  baseUrl?: unknown;
  headers?: Record<string, unknown>;
};

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractBearerToken(value: unknown): string | undefined {
  const raw = normalizeOptionalString(value);
  if (!raw) return undefined;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return normalizeOptionalString(match?.[1] ?? raw);
}

function getUnifiedBillingRuntimeConfig(params: {
  config?: OpenClawConfig;
  scopedCredentialConfig?: Record<string, unknown>;
}): UnifiedBillingRuntimeConfig {
  const providerConfig = params.config?.models?.providers?.['cloudflare-unified-billing'] as
    | UnifiedBillingProviderConfig
    | undefined;
  const pluginConfig = params.config?.plugins?.entries?.['cloudflare-unified-billing']?.config as
    | { cfAiGatewayApiKey?: unknown }
    | undefined;

  const baseUrl = normalizeOptionalString(providerConfig?.baseUrl);
  const apiKey =
    normalizeOptionalString(process.env[API_TOKEN_ENV_VAR]) ??
    normalizeOptionalString(params.scopedCredentialConfig?.cfAiGatewayApiKey) ??
    normalizeOptionalString(pluginConfig?.cfAiGatewayApiKey) ??
    extractBearerToken(providerConfig?.headers?.['Authorization']) ??
    normalizeOptionalString(process.env[ENV_VAR]);
  const gatewayId = normalizeOptionalString(providerConfig?.headers?.['cf-aig-gateway-id']);

  // Cloudflare Access credentials may come from the provider config headers
  // (written by onboard) or directly from the environment. The custom domain
  // comes from env or is inferred from a non-REST base URL.
  const envAccess = readAccessCredentials(process.env as Record<string, unknown>);
  const access = hasAccessCredentials(envAccess)
    ? envAccess
    : {
        token: normalizeOptionalString(providerConfig?.headers?.['cf-access-token']),
        clientId: normalizeOptionalString(providerConfig?.headers?.['CF-Access-Client-Id']),
        clientSecret: normalizeOptionalString(providerConfig?.headers?.['CF-Access-Client-Secret']),
      };
  const customDomain =
    normalizeCustomDomain(process.env[CUSTOM_DOMAIN_ENV_VAR]) ?? customDomainFromBaseUrl(baseUrl);

  return { baseUrl, apiKey, gatewayId, customDomain, access };
}

function isRuntimeConfigured(runtime: UnifiedBillingRuntimeConfig): boolean {
  return Boolean(runtime.baseUrl && (runtime.apiKey || hasAccessCredentials(runtime.access)));
}

function buildRuntimeHeaders(runtime: UnifiedBillingRuntimeConfig): Record<string, string> {
  return buildGatewayAuthHeaders({
    apiToken: runtime.apiKey,
    gatewayId: runtime.gatewayId,
    customDomain: runtime.customDomain,
    access: runtime.access,
  });
}

function pickSupportedModel(params: {
  requestedModel: unknown;
  supportedModels: readonly string[];
  fallbackModel: string;
}): string {
  const requested = normalizeOptionalString(params.requestedModel);
  if (requested && params.supportedModels.includes(requested)) {
    return requested;
  }
  return params.fallbackModel;
}

function sanitizePromptInput(value: string, maxLength = 4000): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function normalizeHttpUrl(value: unknown): string | undefined {
  const raw = normalizeOptionalString(value);
  if (!raw) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return undefined;
  }
  return parsed.toString();
}

function resolveImageCount(count: number | undefined): number {
  return Math.max(count ?? 1, 1);
}

async function requestChatCompletion(params: {
  baseUrl: string;
  authHeaders: Record<string, string>;
  model: string;
  userPrompt: string;
}): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${params.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'content-type': 'application/json',
        ...params.authHeaders,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [{ role: 'user', content: params.userPrompt }],
        temperature: 0,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted')) {
      throw new Error(`Gateway request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`, {
        cause: error,
      });
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Gateway request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return normalizeOptionalString(payload.choices?.[0]?.message?.content) ?? '';
}

export function createWebSearchProvider(): WebSearchProviderPlugin {
  return {
    id: WEB_SEARCH_PROVIDER_ID,
    label: 'Perplexity via CF AI Gateway',
    hint: 'Web search with citations through Perplexity Sonar models.',
    envVars: [ENV_VAR, API_TOKEN_ENV_VAR],
    placeholder: 'sonar-...',
    signupUrl: 'https://cloudflare.com/products/ai-gateway/',
    credentialPath: WEB_SEARCH_CREDENTIAL_PATH,
    getCredentialValue: (searchConfig) => searchConfig?.cfAiGatewayApiKey,
    setCredentialValue: (searchConfigTarget, value) => {
      searchConfigTarget.cfAiGatewayApiKey = value;
    },
    createTool: ({ config, searchConfig }) => ({
      description:
        'Search the web using Cloudflare AI Gateway Perplexity Sonar models. Set model to one of: ' +
        WEB_SEARCH_MODELS.join(', '),
      parameters: {},
      execute: async (args) => {
        const query = normalizeOptionalString(args.query);
        if (!query) {
          return { content: [{ type: 'text', text: 'Missing required `query` argument.' }] };
        }
        const normalizedQuery = sanitizePromptInput(query);

        const runtime = getUnifiedBillingRuntimeConfig({
          config,
          scopedCredentialConfig: searchConfig,
        });
        if (!runtime.baseUrl || !(runtime.apiKey || hasAccessCredentials(runtime.access))) {
          return {
            content: [
              {
                type: 'text',
                text: 'Cloudflare AI Gateway is not configured. Set base URL and API key first.',
              },
            ],
          };
        }

        const model = pickSupportedModel({
          requestedModel: args.model,
          supportedModels: WEB_SEARCH_MODELS,
          fallbackModel: WEB_SEARCH_MODELS[0],
        });

        const content = await requestChatCompletion({
          baseUrl: runtime.baseUrl,
          authHeaders: buildRuntimeHeaders(runtime),
          model,
          userPrompt: `Search the web for: ${normalizedQuery}\nReturn concise findings with citations and source links.`,
        });
        return { content: [{ type: 'text', text: content }] };
      },
    }),
  };
}

export function createWebFetchProvider(): WebFetchProviderPlugin {
  return {
    id: WEB_FETCH_PROVIDER_ID,
    label: 'Google Gemini via CF AI Gateway',
    hint: 'Fetch and render web pages through Google Gemini models.',
    envVars: [ENV_VAR, API_TOKEN_ENV_VAR],
    placeholder: 'gemini-...',
    signupUrl: 'https://cloudflare.com/products/ai-gateway/',
    credentialPath: WEB_FETCH_CREDENTIAL_PATH,
    getCredentialValue: (fetchConfig) => fetchConfig?.cfAiGatewayApiKey,
    setCredentialValue: (fetchConfigTarget, value) => {
      fetchConfigTarget.cfAiGatewayApiKey = value;
    },
    createTool: ({ config, fetchConfig }) => ({
      description:
        'Fetch web pages via Cloudflare AI Gateway. Suggested models: ' +
        WEB_FETCH_MODELS.join(', '),
      parameters: {},
      execute: async (args) => {
        const url = normalizeHttpUrl(args.url);
        if (!url) {
          return {
            content: [
              { type: 'text', text: 'Missing or invalid `url` argument (must be http/https).' },
            ],
          };
        }

        const runtime = getUnifiedBillingRuntimeConfig({
          config,
          scopedCredentialConfig: fetchConfig,
        });
        if (!runtime.baseUrl || !(runtime.apiKey || hasAccessCredentials(runtime.access))) {
          return {
            content: [
              {
                type: 'text',
                text: 'Cloudflare AI Gateway is not configured. Set base URL and API key first.',
              },
            ],
          };
        }

        const model = pickSupportedModel({
          requestedModel: args.model,
          supportedModels: WEB_FETCH_MODELS,
          fallbackModel: WEB_FETCH_MODELS[0],
        });

        const content = await requestChatCompletion({
          baseUrl: runtime.baseUrl,
          authHeaders: buildRuntimeHeaders(runtime),
          model,
          userPrompt: `Fetch and summarize this URL in markdown with key facts, links, and publication date when available:\n${url}`,
        });
        return { content: [{ type: 'text', text: content }] };
      },
    }),
  };
}

export function createImageGenerationProvider(): ImageGenerationProviderPlugin {
  return {
    id: IMAGE_GENERATION_PROVIDER_ID,
    label: 'Google Gemini Images via CF AI Gateway',
    defaultModel: IMAGE_GENERATION_MODELS[0],
    models: [...IMAGE_GENERATION_MODELS],
    capabilities: {
      generate: {
        maxCount: 4,
        supportsAspectRatio: true,
      },
      edit: {
        enabled: true,
        maxInputImages: 4,
        maxCount: 4,
        supportsAspectRatio: true,
      },
      output: {
        formats: ['png', 'jpeg', 'webp'],
        backgrounds: ['transparent', 'opaque', 'auto'],
      },
    },
    isConfigured: ({ cfg }) => {
      const runtime = getUnifiedBillingRuntimeConfig({
        config: cfg,
        scopedCredentialConfig: cfg?.plugins?.entries?.['cloudflare-unified-billing']?.config as
          | Record<string, unknown>
          | undefined,
      });
      return isRuntimeConfigured(runtime);
    },
    generateImage: async (req) => {
      const runtime = getUnifiedBillingRuntimeConfig({
        config: req.cfg,
        scopedCredentialConfig: req.cfg?.plugins?.entries?.['cloudflare-unified-billing']
          ?.config as Record<string, unknown> | undefined,
      });
      if (!runtime.baseUrl || !(runtime.apiKey || hasAccessCredentials(runtime.access))) {
        return { images: [] };
      }

      const model = pickSupportedModel({
        requestedModel: req.model,
        supportedModels: IMAGE_GENERATION_MODELS,
        fallbackModel: IMAGE_GENERATION_MODELS[0],
      });

      let response: Response;
      try {
        response = await fetch(`${runtime.baseUrl}/images/generations`, {
          method: 'POST',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          headers: {
            'content-type': 'application/json',
            ...buildRuntimeHeaders(runtime),
          },
          body: JSON.stringify({
            model,
            prompt: req.prompt,
            n: resolveImageCount(req.count),
            ...(req.size ? { size: req.size } : {}),
          }),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.toLowerCase().includes('timeout') ||
          message.toLowerCase().includes('aborted')
        ) {
          throw new Error(`Image generation timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`, {
            cause: error,
          });
        }
        throw error;
      }
      if (!response.ok) {
        throw new Error(`Image generation failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        data?: Array<{ b64_json?: string; revised_prompt?: string }>;
      };
      const images =
        payload.data
          ?.map((image, index) => {
            const b64 = normalizeOptionalString(image.b64_json);
            if (!b64) return undefined;
            return {
              buffer: Buffer.from(b64, 'base64'),
              mimeType: 'image/png',
              fileName: `cloudflare-ai-gateway-image-${index + 1}.png`,
              revisedPrompt: normalizeOptionalString(image.revised_prompt),
            };
          })
          .filter((image): image is NonNullable<typeof image> => Boolean(image)) ?? [];

      return { images, model };
    },
  };
}
