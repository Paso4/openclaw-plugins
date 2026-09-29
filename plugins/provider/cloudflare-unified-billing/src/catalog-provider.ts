import { normalizeOptionalString } from 'openclaw/plugin-sdk/string-coerce-runtime';
import { ALL_MODELS, normalizeCustomDomain, resolveBaseUrl } from './models.js';
import { buildGatewayAuthHeaders, hasAccessCredentials, type AccessCredentials } from './access.js';
import { createSubsystemLogger } from 'openclaw/plugin-sdk/runtime-env';

export type CatalogProviderParams = {
  credential?: {
    type?: string;
    key?: unknown;
    metadata?: {
      accountId?: unknown;
      gatewayId?: unknown;
    };
  };
  envApiKey?: string;
  envApiToken?: string;
  envAccountId?: string;
  envGatewayId?: string;
  envCustomDomain?: string;
  envAccess?: AccessCredentials;
};

const log = createSubsystemLogger('cloudflare-unified-billing/catalog-provider');

export function buildCatalogProvider(params: CatalogProviderParams): {
  baseUrl: string;
  apiKey?: string;
  api: 'openai-completions';
  headers?: Record<string, string>;
  models: typeof ALL_MODELS;
} | null {
  let credentialToken: string | undefined;
  let credentialAccountId: string | undefined;
  let credentialGatewayId: string | undefined;

  if (params.credential && params.credential.type === 'api_key') {
    credentialToken = normalizeOptionalString(params.credential.key);
    credentialAccountId = normalizeOptionalString(params.credential.metadata?.accountId);
    credentialGatewayId = normalizeOptionalString(params.credential.metadata?.gatewayId);
    log.debug(
      `Using credential (hasAccountId=${Boolean(credentialAccountId)} hasGatewayId=${Boolean(credentialGatewayId)})`,
    );
  }

  // The REST endpoint requires the AI-scoped Cloudflare API token. Keep the
  // legacy profile key as the final compatibility fallback. Current env
  // bindings are authoritative during rotation and tenant reassignment.
  const envApiToken = normalizeOptionalString(params.envApiToken);
  const envApiKey = normalizeOptionalString(params.envApiKey);
  const cfToken = envApiToken ?? envApiKey ?? credentialToken;
  const accountId = normalizeOptionalString(params.envAccountId) ?? credentialAccountId;
  const gatewayId = normalizeOptionalString(params.envGatewayId) ?? credentialGatewayId;
  const customDomain = normalizeCustomDomain(params.envCustomDomain);
  const usingAccess = Boolean(customDomain && hasAccessCredentials(params.envAccess));

  // An Access-protected custom domain authenticates with the Access credential
  // alone, so an AI Gateway token (and the account/gateway IDs it needs) is not
  // required on that path.
  if (!cfToken && !usingAccess) {
    log.debug('No REST API token found in credential or env vars');
    return null;
  }

  if (!customDomain && (!accountId || !gatewayId)) {
    log.error(
      `Missing accountId or gatewayId (hasAccountId=${Boolean(accountId)} hasGatewayId=${Boolean(gatewayId)})`,
    );
    return null;
  }

  const baseUrl = resolveBaseUrl({ accountId, gatewayId, customDomain });
  if (!baseUrl) {
    log.error('Failed to resolve baseUrl');
    return null;
  }

  log.debug(
    `Building catalog provider for Cloudflare Unified Billing (hasAccountId=${Boolean(accountId)} hasGatewayId=${Boolean(gatewayId)} hasCustomDomain=${Boolean(customDomain)} access=${usingAccess})`,
  );

  const result = {
    baseUrl,
    api: 'openai-completions' as const,
    apiKey: cfToken,
    headers: buildGatewayAuthHeaders({
      apiToken: cfToken,
      gatewayId,
      customDomain,
      access: params.envAccess,
    }),
    models: ALL_MODELS,
  };

  const tokenSource = envApiToken
    ? 'CLOUDFLARE_API_TOKEN'
    : envApiKey
      ? 'CLOUDFLARE_AI_GATEWAY_API_KEY'
      : credentialToken
        ? 'auth-profile'
        : 'none';
  log.debug(
    `Catalog provider built: tokenSource=${usingAccess ? 'access' : tokenSource} modelCount=${ALL_MODELS.length} hasCustomDomain=${Boolean(customDomain)}`,
  );

  return result;
}
