import type { ProviderWrapStreamFnContext } from 'openclaw/plugin-sdk/plugin-entry';
import { createSubsystemLogger } from 'openclaw/plugin-sdk/runtime-env';
import { getOpenClawRunId } from './index.js';

// OpenClaw 2026.8.2 no longer ships a public `StreamFn` export; derive it from
// the provider stream-wrap context (the same signature the gateway passes in).
type StreamFn = NonNullable<ProviderWrapStreamFnContext['streamFn']>;

const log = createSubsystemLogger('cloudflare-unified-billing/stream-wrapper');

function buildCfAigMetadata(runId?: string): string | undefined {
  if (!runId) return undefined;
  return JSON.stringify({ openclaw_run_id: runId });
}

export function wrapCloudflareUnifiedBillingStream(
  ctx: ProviderWrapStreamFnContext,
): StreamFn | undefined {
  if (!ctx.streamFn) {
    log.error('No streamFn provided in context');
    return undefined;
  }

  const inner = ctx.streamFn;

  return async (model, context, options) => {
    const hasAuthorization = Boolean(model.headers?.Authorization);

    let finalModel = model;
    let finalOptions = options;

    log.info(
      `Wrapping streamFn for Cloudflare Unified Billing. modelId=${model.id} provider=${model.provider} baseUrl=${model.baseUrl ?? 'undefined'} hasAuthorization=${hasAuthorization ? 'present' : 'absent'} apiKey=${(options as { apiKey?: string })?.apiKey ? 'present' : 'absent'}`,
    );

    if (hasAuthorization) {
      finalModel = { ...model };
    } else {
      const apiKey = (options as { apiKey?: string })?.apiKey;
      if (apiKey) {
        finalModel = {
          ...model,
          headers: {
            ...model.headers,
            Authorization: `Bearer ${apiKey}`,
          } as Record<string, string>,
        };
        finalOptions = {
          ...options,
          apiKey: undefined,
        };
      } else {
        log.error(
          `Missing CF auth headers. model.headers=${JSON.stringify(model.headers)} options.apiKey=${(options as { apiKey?: string })?.apiKey}`,
        );
      }
    }

    const runId = getOpenClawRunId();
    const aigMetadata = buildCfAigMetadata(runId);
    if (aigMetadata) {
      finalModel = {
        ...finalModel,
        headers: {
          ...finalModel.headers,
          'cf-aig-metadata': aigMetadata,
        } as Record<string, string>,
      };
    }

    log.info(
      `CF Unified Billing request: modelId=${finalModel.id} baseUrl=${finalModel.baseUrl ?? 'undefined'} headers=${JSON.stringify(finalModel.headers)}`,
    );

    return inner(finalModel, context, finalOptions);
  };
}
