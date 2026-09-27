import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { ensureAuthProfileStore, listProfilesForProvider } from 'openclaw/plugin-sdk/provider-auth';
import { normalizeOptionalString } from 'openclaw/plugin-sdk/string-coerce-runtime';
import { buildCatalogProvider } from './catalog-provider.js';
import { PROVIDER_ID, ALL_MODELS, normalizeCustomDomain, resolveBaseUrl } from './models.js';
import { buildGatewayAuthHeaders, hasAccessCredentials, readAccessCredentials } from './access.js';
import { wrapCloudflareUnifiedBillingStream } from './stream-wrappers.js';
import { createSubsystemLogger } from 'openclaw/plugin-sdk/runtime-env';
import {
  createImageGenerationProvider,
  createWebFetchProvider,
  createWebSearchProvider,
} from './capabilities.js';

const ENV_VAR = 'CLOUDFLARE_AI_GATEWAY_API_KEY';
const API_TOKEN_ENV_VAR = 'CLOUDFLARE_API_TOKEN';
const ACCOUNT_ID_ENV_VAR = 'CF_AI_GATEWAY_ACCOUNT_ID';
const GATEWAY_ID_ENV_VAR = 'CF_AI_GATEWAY_GATEWAY_ID';
const CUSTOM_DOMAIN_ENV_VAR = 'CF_AI_GATEWAY_CUSTOM_DOMAIN';
const ALIASED_PROVIDER = 'cloudflare-ai-gateway';

// Global cache for headers from catalog provider (used when no auth profile exists)
let cachedCfHeaders: Record<string, string> | undefined;

// OpenClaw Run ID for Cloudflare OTEL cost attribution.
// Captured by before_agent_start hook and injected as cf-aig-metadata
// on every AI Gateway request via normalizeResolvedModel + wrapStreamFn.
let currentOpenClawRunId: string | undefined;

export function setOpenClawRunId(runId: string | undefined): void {
  currentOpenClawRunId = runId;
}

export function getOpenClawRunId(): string | undefined {
  return currentOpenClawRunId;
}

function buildCfAigMetadata(runId?: string): string | undefined {
  if (!runId) return undefined;
  return JSON.stringify({ openclaw_run_id: runId });
}

// An Access token (`cf-access-token`) or service-token headers also count as
// resolved auth alongside the standard `Authorization` header.
function hasAuthHeaders(headers: Record<string, unknown> | undefined): boolean {
  return Boolean(
    headers?.Authorization || headers?.['cf-access-token'] || headers?.['CF-Access-Client-Id'],
  );
}

function redactHeadersForLog(
  headers: Record<string, string | null | undefined> | undefined,
): Record<string, string | null | undefined> | undefined {
  if (!headers) return headers;
  const redacted = { ...headers };
  for (const key of Object.keys(redacted)) {
    const value = redacted[key];
    if (typeof value !== 'string') continue;
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === 'authorization' ||
      lowerKey === 'cf-aig-authorization' ||
      lowerKey.includes('api-key') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret')
    ) {
      redacted[key] = '***';
    }
  }
  return redacted;
}

export default definePluginEntry({
  id: PROVIDER_ID,
  name: 'Cloudflare Unified Billing Provider',
  description:
    'Full model catalog for Cloudflare AI Gateway. Exposes 150+ models from Google Gemini (⚠️ degraded tool calling), Anthropic Claude, OpenAI, xAI Grok, DeepSeek, Alibaba Qwen, MiniMax, Moonshot Kimi, Workers AI frontier models, and more through the unified billing REST endpoint.',
  register(api) {
    const log = createSubsystemLogger('cloudflare-unified-billing');

    api.on(
      'message_received',
      async (event) => {
        if (event.runId) {
          setOpenClawRunId(event.runId);
        }
      },
      { priority: 100 },
    );

    api.on('agent_end', async () => {
      setOpenClawRunId(undefined);
    });

    api.registerWebSearchProvider(createWebSearchProvider());
    api.registerWebFetchProvider(createWebFetchProvider());
    api.registerImageGenerationProvider(createImageGenerationProvider());
    api.registerProvider({
      id: PROVIDER_ID,
      label: 'CF AI Gateway (Unified Billing)',
      docsPath: '/providers/cloudflare-unified-billing',
      envVars: [
        'CLOUDFLARE_AI_GATEWAY_API_KEY',
        'CLOUDFLARE_API_TOKEN',
        'CF_AI_GATEWAY_ACCOUNT_ID',
        'CF_AI_GATEWAY_GATEWAY_ID',
        'CF_AI_GATEWAY_CUSTOM_DOMAIN',
        'CF_ACCESS_TOKEN',
        'CF_ACCESS_CLIENT_ID',
        'CF_ACCESS_CLIENT_SECRET',
      ],
      auth: [],
      catalog: {
        order: 'late',
        run: async (ctx) => {
          const authStore = ensureAuthProfileStore(ctx.agentDir, {
            allowKeychainPrompt: false,
          });
          const envApiKey = normalizeOptionalString(ctx.env[ENV_VAR]);
          const envApiToken = normalizeOptionalString(ctx.env[API_TOKEN_ENV_VAR]);
          const envAccountId = normalizeOptionalString(ctx.env[ACCOUNT_ID_ENV_VAR]);
          const envGatewayId = normalizeOptionalString(ctx.env[GATEWAY_ID_ENV_VAR]);
          const envCustomDomain = normalizeCustomDomain(ctx.env[CUSTOM_DOMAIN_ENV_VAR]);
          const envAccess = readAccessCredentials(ctx.env as Record<string, unknown>);
          const usingAccess = Boolean(envCustomDomain && hasAccessCredentials(envAccess));

          // Check profiles from both cloudflare-unified-billing and cloudflare-ai-gateway (aliased)
          const providerIdsToCheck = [PROVIDER_ID, ALIASED_PROVIDER];
          log.info(
            `Looking for credentials in auth store for providers: ${providerIdsToCheck.join(' or ')}`,
          );
          for (const providerId of providerIdsToCheck) {
            for (const profileId of listProfilesForProvider(authStore, providerId)) {
              const provider = buildCatalogProvider({
                credential: authStore.profiles[profileId],
                envApiKey,
                envApiToken,
                envAccountId,
                envGatewayId,
                envCustomDomain,
                envAccess,
              });
              if (!provider) {
                continue;
              }
              return {
                provider,
              };
            }
          }

          // Fallback: build provider from env vars alone. A custom domain uses
          // the gateway endpoint, so account/gateway IDs are optional there;
          // an Access-protected domain does not need an AI Gateway token.
          log.info(
            `No credentials found in auth store for providers ${providerIdsToCheck.join(
              ' or ',
            )}. Falling back to env vars if available.`,
          );
          if ((envAccountId && envGatewayId) || usingAccess) {
            const provider = buildCatalogProvider({
              credential: undefined,
              envApiKey,
              envApiToken,
              envAccountId,
              envGatewayId,
              envCustomDomain,
              envAccess,
            });
            if (provider) {
              log.info(
                `Successfully built Cloudflare Unified Billing provider from env vars. accountId=${envAccountId ?? 'undefined'} gatewayId=${envGatewayId ?? 'undefined'} customDomain=${envCustomDomain ?? 'undefined'} tokenSource=${usingAccess ? 'access' : envApiToken ? API_TOKEN_ENV_VAR : envApiKey ? ENV_VAR : 'undefined'}`,
              );
              // Cache headers for normalizeResolvedModel to use
              if (provider.headers) {
                cachedCfHeaders = { ...provider.headers };
              }
              return { provider };
            }
          }

          log.error(
            "No valid credentials found for Cloudflare Unified Billing provider. Provider won't be available.",
          );

          return null;
        },
      },
      normalizeResolvedModel: (ctx) => {
        log.subsystem = 'cloudflare-unified-billing/normalize-resolved-model';

        log.info(
          `normalizeResolvedModel hook called for modelId=${ctx.modelId} provider=${ctx.provider}`,
        );

        const model = ctx.model;
        const processEnvApiKey = normalizeOptionalString(process.env[ENV_VAR]);
        const processEnvApiToken = normalizeOptionalString(process.env[API_TOKEN_ENV_VAR]);
        const processEnvAccountId = normalizeOptionalString(process.env[ACCOUNT_ID_ENV_VAR]);
        const processEnvGatewayId = normalizeOptionalString(process.env[GATEWAY_ID_ENV_VAR]);
        const processEnvCustomDomain = normalizeCustomDomain(process.env[CUSTOM_DOMAIN_ENV_VAR]);
        const processEnvAccess = readAccessCredentials(process.env as Record<string, unknown>);
        // Prefer the AI-scoped REST token; the gateway key remains a legacy fallback.
        const processEnvToken = processEnvApiToken ?? processEnvApiKey;
        const usingEnvAccess = Boolean(
          processEnvCustomDomain && hasAccessCredentials(processEnvAccess),
        );

        // Try to resolve baseUrl/headers from auth profiles in agentDir
        if (ctx.agentDir) {
          const authStore = ensureAuthProfileStore(ctx.agentDir, {
            allowKeychainPrompt: false,
          });

          const providerIdsToCheck = [PROVIDER_ID, ALIASED_PROVIDER];
          let foundAuth = false;

          for (const providerId of providerIdsToCheck) {
            for (const profileId of listProfilesForProvider(authStore, providerId)) {
              const profile = authStore.profiles[profileId];
              if (profile?.type === 'api_key') {
                const accountId =
                  processEnvAccountId ?? normalizeOptionalString(profile.metadata?.accountId);
                const gatewayId =
                  processEnvGatewayId ?? normalizeOptionalString(profile.metadata?.gatewayId);
                const apiKey = normalizeOptionalString(profile.key);

                const authToken = processEnvApiToken ?? processEnvApiKey ?? apiKey;

                if (accountId && gatewayId && authToken) {
                  const customDomain = processEnvCustomDomain;
                  model.baseUrl = resolveBaseUrl({ accountId, gatewayId, customDomain });
                  model.headers = {
                    ...model.headers,
                    ...buildGatewayAuthHeaders({
                      apiToken: authToken,
                      gatewayId,
                      customDomain,
                      access: processEnvAccess,
                    }),
                  };
                  log.info(
                    `Resolved auth from profile for provider=${providerId}. accountId=${accountId} gatewayId=${gatewayId} customDomain=${customDomain ?? 'undefined'} tokenSource=${processEnvApiToken ? API_TOKEN_ENV_VAR : 'profile'}`,
                  );
                  foundAuth = true;
                  break;
                }
              }
            }
            if (foundAuth) break;
          }

          if (!foundAuth) {
            log.warn(
              `No valid auth profiles found in agentDir for providers: ${providerIdsToCheck.join(' or ')}`,
            );
          }
        } else {
          log.warn(`No agentDir available in normalizeResolvedModel context`);
        }

        // If baseUrl not resolved from profiles, check if catalog set it in config
        const providerConfig = ctx.config?.models?.providers?.[ctx.provider];
        if (!model.baseUrl && providerConfig?.baseUrl) {
          model.baseUrl = providerConfig.baseUrl;
          log.info(`Using baseUrl from provider config: ${providerConfig.baseUrl}`);
        }

        // Merge headers from config if present
        if (providerConfig?.headers) {
          model.headers = {
            ...model.headers,
            ...(providerConfig.headers as Record<string, string>),
          };
          log.info(`Merged headers from provider config`);
        }

        // Fallback: if no auth yet, check cached headers from catalog provider
        if (!hasAuthHeaders(model.headers) && cachedCfHeaders) {
          model.headers = {
            ...model.headers,
            ...cachedCfHeaders,
          };
          log.info(`Merged cached headers from catalog provider`);
        }

        // Fallback: if still no baseUrl/auth, use env vars directly from process.env
        if (!model.baseUrl || !hasAuthHeaders(model.headers)) {
          const hasEnvRoute = Boolean(processEnvCustomDomain || processEnvAccountId);

          if (hasEnvRoute) {
            if (!model.baseUrl) {
              model.baseUrl = resolveBaseUrl({
                accountId: processEnvAccountId,
                gatewayId: processEnvGatewayId,
                customDomain: processEnvCustomDomain,
              });
              log.info(
                `Resolved baseUrl from process.env: accountId=${processEnvAccountId ?? 'undefined'} gatewayId=${processEnvGatewayId ?? 'undefined'} customDomain=${processEnvCustomDomain ?? 'undefined'}`,
              );
            }
            if (!hasAuthHeaders(model.headers) && (processEnvToken || usingEnvAccess)) {
              model.headers = {
                ...model.headers,
                ...buildGatewayAuthHeaders({
                  apiToken: processEnvToken,
                  gatewayId: processEnvGatewayId,
                  customDomain: processEnvCustomDomain,
                  access: processEnvAccess,
                }),
              };
              log.info(
                `Resolved auth header from process.env (using ${usingEnvAccess ? 'cloudflare-access' : processEnvApiToken ? API_TOKEN_ENV_VAR : ENV_VAR})`,
              );
            }
          } else {
            log.warn(
              `Missing process.env for fallback: ENV_VAR=${processEnvApiKey ? 'set' : 'missing'} API_TOKEN=${processEnvApiToken ? 'set' : 'missing'} ACCOUNT_ID=${processEnvAccountId ? 'set' : 'missing'} GATEWAY_ID=${processEnvGatewayId ? 'set' : 'missing'} CUSTOM_DOMAIN=${processEnvCustomDomain ? 'set' : 'missing'}`,
            );
          }
        }

        // Environment bindings are the source of truth during credential
        // rotation. Re-apply them after config headers so stale restored
        // profile/config values cannot overwrite the current tenant route. A
        // custom domain (optionally Access-protected) takes precedence over the
        // REST endpoint.
        const envRouteConfigured = Boolean(
          usingEnvAccess ||
          (processEnvCustomDomain && processEnvToken) ||
          (processEnvToken && processEnvAccountId && processEnvGatewayId),
        );
        if (envRouteConfigured) {
          model.baseUrl = resolveBaseUrl({
            accountId: processEnvAccountId,
            gatewayId: processEnvGatewayId,
            customDomain: processEnvCustomDomain,
          });
          model.headers = {
            ...model.headers,
            ...buildGatewayAuthHeaders({
              apiToken: processEnvToken,
              gatewayId: processEnvGatewayId,
              customDomain: processEnvCustomDomain,
              access: processEnvAccess,
            }),
          };
        }

        const metadata = buildCfAigMetadata(currentOpenClawRunId);
        if (metadata) {
          model.headers = {
            ...model.headers,
            'cf-aig-metadata': metadata,
          };
        }

        log.info(
          `normalizeResolvedModel result: modelId=${model.id} baseUrl=${model.baseUrl ?? 'undefined'} api: ${model.api ?? 'undefined'} headers=${JSON.stringify(redactHeadersForLog(model.headers as Record<string, string | null | undefined> | undefined))}`,
        );

        return model;
      },

      resolveDynamicModel: (ctx) => {
        const modelId = ctx.modelId.trim();
        if (!modelId) return undefined;

        const knownModel = ALL_MODELS.find((m) => m.id === modelId);

        log.info(
          `Resolving modelId=${modelId} to Cloudflare Unified Billing model. Known model: ${!!knownModel}`,
        );

        return {
          id: modelId,
          name: knownModel?.name ?? modelId,
          provider: PROVIDER_ID,
          api: 'openai-completions' as const,
          baseUrl: '',
          reasoning: knownModel?.reasoning ?? false,
          input: (knownModel?.input ?? ['text']) as ('text' | 'image')[],
          cost: knownModel?.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: knownModel?.contextWindow ?? 128000,
          maxTokens: knownModel?.maxTokens ?? 4096,
        };
      },
      wrapStreamFn: wrapCloudflareUnifiedBillingStream,
      classifyFailoverReason: ({ errorMessage }) => {
        return /\bworkers?_ai\b.*\b(?:rate|limit|quota)\b/i.test(errorMessage)
          ? 'rate_limit'
          : undefined;
      },
    });
  },
});
