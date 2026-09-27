// Cloudflare Access credentials for AI Gateway custom domains.
//
// Putting an AI Gateway custom domain behind Cloudflare Access is what enables
// identity-aware controls: AI Gateway records the verified Access subject as
// `cf.user_id`, which the User Insights dashboard uses to attribute spend to
// individual identities. See:
// - https://developers.cloudflare.com/ai-gateway/configuration/cloudflare-access/
// - https://developers.cloudflare.com/ai-gateway/observability/user-insights/

export const ACCESS_TOKEN_ENV_VAR = 'CF_ACCESS_TOKEN';
export const ACCESS_CLIENT_ID_ENV_VAR = 'CF_ACCESS_CLIENT_ID';
export const ACCESS_CLIENT_SECRET_ENV_VAR = 'CF_ACCESS_CLIENT_SECRET';

export type AccessCredentials = {
  /** Short-lived user Access JWT from `cloudflared access login`. */
  token?: string;
  /** Access service token client ID (headless automation). */
  clientId?: string;
  /** Access service token client secret (headless automation). */
  clientSecret?: string;
};

function normalize(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readAccessCredentials(env: Record<string, unknown> | undefined): AccessCredentials {
  return {
    token: normalize(env?.[ACCESS_TOKEN_ENV_VAR]),
    clientId: normalize(env?.[ACCESS_CLIENT_ID_ENV_VAR]),
    clientSecret: normalize(env?.[ACCESS_CLIENT_SECRET_ENV_VAR]),
  };
}

export function hasAccessCredentials(creds: AccessCredentials | undefined): boolean {
  if (!creds) return false;
  if (creds.token) return true;
  return Boolean(creds.clientId && creds.clientSecret);
}

/**
 * Build the Cloudflare Access authentication headers for an Access-protected
 * AI Gateway custom domain.
 *
 * - `cf-access-token` carries a user Access JWT. AI Gateway adds the verified
 *   Access subject as `cf.user_id`, so User Insights attributes spend per user.
 * - Service tokens (`CF-Access-Client-Id` / `CF-Access-Client-Secret`) work for
 *   headless automation, but service-token requests do not receive
 *   `cf.user_id` and therefore stay grouped under one anonymous identity.
 */
export function buildAccessHeaders(creds: AccessCredentials | undefined): Record<string, string> {
  if (!creds) return {};
  if (creds.token) {
    return { 'cf-access-token': creds.token };
  }
  if (creds.clientId && creds.clientSecret) {
    return {
      'CF-Access-Client-Id': creds.clientId,
      'CF-Access-Client-Secret': creds.clientSecret,
    };
  }
  return {};
}

/**
 * Build the authentication headers for an AI Gateway request.
 *
 * On an Access-protected custom domain the Access credential *is* the request
 * credential — AI Gateway accepts it directly and the client does not need to
 * send an AI Gateway token. On the default endpoint (or an unprotected custom
 * domain) the request authenticates with the AI Gateway token and, when the
 * hostname does not already identify the gateway, the `cf-aig-gateway-id`
 * routing header.
 */
export function buildGatewayAuthHeaders(params: {
  apiToken?: string;
  gatewayId?: string;
  customDomain?: string;
  access?: AccessCredentials;
}): Record<string, string> {
  if (params.customDomain && hasAccessCredentials(params.access)) {
    return buildAccessHeaders(params.access);
  }

  const headers: Record<string, string> = {};
  if (params.apiToken) {
    headers.Authorization = `Bearer ${params.apiToken}`;
  }
  if (params.gatewayId && !params.customDomain) {
    headers['cf-aig-gateway-id'] = params.gatewayId;
  }
  return headers;
}
