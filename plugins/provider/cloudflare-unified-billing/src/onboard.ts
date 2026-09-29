import type { OpenClawConfig } from 'openclaw/plugin-sdk/core';
import { DEFAULT_MODEL_REF, normalizeCustomDomain, resolveBaseUrl } from './models.js';
import { buildGatewayAuthHeaders, type AccessCredentials } from './access.js';
import { createSubsystemLogger } from 'openclaw/plugin-sdk/runtime-env';

const log = createSubsystemLogger('cloudflare-unified-billing/onboard');

type UnifiedBillingProviderParams = {
  accountId?: string;
  gatewayId?: string;
  customDomain?: string;
  access?: AccessCredentials;
};

function buildProvider(
  params: UnifiedBillingProviderParams,
  apiToken?: string,
): {
  baseUrl: string;
  api: 'openai-completions';
  headers: Record<string, string>;
  models: never[];
} {
  const customDomain = normalizeCustomDomain(params.customDomain);
  return {
    baseUrl: resolveBaseUrl({
      accountId: params.accountId,
      gatewayId: params.gatewayId,
      customDomain,
    }),
    api: 'openai-completions' as const,
    headers: buildGatewayAuthHeaders({
      apiToken,
      gatewayId: params.gatewayId,
      customDomain,
      access: params.access,
    }),
    models: [],
  };
}

export function buildConfigPatch(
  params: UnifiedBillingProviderParams & { apiToken?: string },
): Partial<OpenClawConfig> {
  log.debug(
    `Building config patch for Cloudflare Unified Billing (hasAccountId=${Boolean(params.accountId)} hasGatewayId=${Boolean(params.gatewayId)} hasCustomDomain=${Boolean(params.customDomain)} hasApiToken=${Boolean(params.apiToken)} hasAccess=${Boolean(params.access && (params.access.token || (params.access.clientId && params.access.clientSecret)))})`,
  );
  return {
    models: {
      providers: {
        'cloudflare-unified-billing': buildProvider(params, params.apiToken),
      },
    },
    agents: {
      defaults: {
        model: { primary: DEFAULT_MODEL_REF },
      },
    },
  };
}

export function applyConfig(
  cfg: OpenClawConfig,
  params?: UnifiedBillingProviderParams & { apiToken?: string },
): OpenClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[DEFAULT_MODEL_REF] = {
    ...models[DEFAULT_MODEL_REF],
    alias: models[DEFAULT_MODEL_REF]?.alias ?? 'Cloudflare Unified Billing',
  };

  log.debug(
    `Applying config patch for Cloudflare Unified Billing (hasAccountId=${Boolean(params?.accountId)} hasGatewayId=${Boolean(params?.gatewayId)} hasCustomDomain=${Boolean(params?.customDomain)} hasApiToken=${Boolean(params?.apiToken)} hasAccess=${Boolean(params?.access && (params.access.token || (params.access.clientId && params.access.clientSecret)))})`,
  );

  const customDomain = normalizeCustomDomain(params?.customDomain);
  if (!customDomain && !(params?.accountId && params?.gatewayId)) {
    return {
      ...cfg,
      agents: {
        ...cfg.agents,
        defaults: {
          ...cfg.agents?.defaults,
          models,
        },
      },
    };
  }

  const provider = buildProvider(params ?? {}, params?.apiToken);

  log.debug(
    `Resolved baseUrl for Cloudflare Unified Billing (hasBaseUrl=${Boolean(provider.baseUrl)})`,
  );

  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: {
        ...cfg.models?.providers,
        'cloudflare-unified-billing': provider,
      },
    },
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        model: { primary: DEFAULT_MODEL_REF },
        models,
      },
    },
  };
}
