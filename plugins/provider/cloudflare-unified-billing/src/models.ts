// OpenClaw 2026.8.2 no longer ships a public `ModelDefinitionConfig` type from
// `openclaw/plugin-sdk/provider-model-shared`. Pin the structural contract this
// static catalog actually uses (mirroring the upstream required fields) so the
// file type-checks against the current SDK without depending on an internal
// type surface.
export type ModelDefinitionConfig = {
  id: string;
  name: string;
  reasoning: boolean;
  input: ('text' | 'image')[];
  contextWindow?: number;
  maxTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
};

export const PROVIDER_ID = 'cloudflare-unified-billing';

export enum CloudflareUnifiedBillingModel {
  // Google AI Studio
  Gemini31FlashLite = 'google/gemini-3.1-flash-lite',
  Gemini31FlashImagePreview = 'google/gemini-3.1-flash-image-preview',
  Gemini31ProPreview = 'google/gemini-3.1-pro-preview',
  Gemini3FlashPreview = 'google/gemini-3-flash-preview',
  Gemini3ProPreview = 'google/gemini-3-pro-preview',
  Gemini31Pro = 'google/gemini-3.1-pro',
  Gemini38Flash = 'google/gemini-3.8-flash',
  Gemini37Flash = 'google/gemini-3.7-flash',
  Gemini36Flash = 'google/gemini-3.6-flash',
  Gemini35Flash = 'google/gemini-3.5-flash',
  Gemini35FlashLite = 'google/gemini-3.5-flash-lite',
  Gemini3Flash = 'google/gemini-3-flash',
  Gemini25Pro = 'google/gemini-2.5-pro',
  Gemini25Flash = 'google/gemini-2.5-flash',
  Gemini25FlashLite = 'google/gemini-2.5-flash-lite',
  Gemini20Flash = 'google/gemini-2.0-flash',
  Gemini15Pro = 'google/gemini-1.5-pro',
  Gemini15Flash = 'google/gemini-1.5-flash',
  Gemini15Flash8b = 'google/gemini-1.5-flash-8b',
  Gemma426bA4bIt = 'google/gemma-4-26b-a4b-it',
  Gemma312bIt = 'google/gemma-3-12b-it',
  Gemma327bIt = 'google/gemma-3-27b-it',
  Gemma29bIt = 'google/gemma-2-9b-it',
  // Google Vertex AI
  VertexGemini25Pro = 'google-vertex-ai/google/gemini-2.5-pro',
  VertexGemini25Flash = 'google-vertex-ai/google/gemini-2.5-flash',
  VertexGemini20Flash = 'google-vertex-ai/google/gemini-2.0-flash',
  VertexGemini15Pro = 'google-vertex-ai/google/gemini-1.5-pro',
  VertexGemini15Flash = 'google-vertex-ai/google/gemini-1.5-flash',
  VertexGemini15Flash8b = 'google-vertex-ai/google/gemini-1.5-flash-8b',
  // Anthropic
  ClaudeOpus48 = 'anthropic/claude-opus-4-8',
  ClaudeOpus47 = 'anthropic/claude-opus-4-7',
  ClaudeOpus46 = 'anthropic/claude-opus-4-6',
  ClaudeOpus45 = 'anthropic/claude-opus-4-5',
  ClaudeSonnet46 = 'anthropic/claude-sonnet-4-6',
  ClaudeSonnet45 = 'anthropic/claude-sonnet-4-5',
  ClaudeHaiku45 = 'anthropic/claude-haiku-4-5',
  ClaudeOpus5 = 'anthropic/claude-opus-5',
  ClaudeOpus55 = 'anthropic/claude-opus-5-5',
  ClaudeSonnet5 = 'anthropic/claude-sonnet-5',
  ClaudeFable5 = 'anthropic/claude-fable-5',
  ClaudeFable51 = 'anthropic/claude-fable-5.1',
  // OpenAI
  Gpt6Astra = 'openai/gpt-6-astra',
  Gpt6Sol = 'openai/gpt-6-sol',
  Gpt6Luna = 'openai/gpt-6-luna',
  Gpt56Sol = 'openai/gpt-5.6-sol',
  Gpt56Terra = 'openai/gpt-5.6-terra',
  Gpt56Luna = 'openai/gpt-5.6-luna',
  Gpt55 = 'openai/gpt-5.5',
  Gpt55Pro = 'openai/gpt-5.5-pro',
  Gpt54 = 'openai/gpt-5.4',
  Gpt54Pro = 'openai/gpt-5.4-pro',
  Gpt54Mini = 'openai/gpt-5.4-mini',
  Gpt54Nano = 'openai/gpt-5.4-nano',
  Gpt52 = 'openai/gpt-5.2',
  Gpt51 = 'openai/gpt-5.1',
  Gpt5 = 'openai/gpt-5',
  Gpt5Pro = 'openai/gpt-5-pro',
  Gpt5Mini = 'openai/gpt-5-mini',
  Gpt5Nano = 'openai/gpt-5-nano',
  Gpt41 = 'openai/gpt-4.1',
  Gpt41Mini = 'openai/gpt-4.1-mini',
  Gpt41Nano = 'openai/gpt-4.1-nano',
  Gpt4o = 'openai/gpt-4o',
  Gpt4oMini = 'openai/gpt-4o-mini',
  CodexMini = 'openai/codex-mini',
  O3 = 'openai/o3',
  O3Pro = 'openai/o3-pro',
  O3DeepResearch = 'openai/o3-deep-research',
  O4Mini = 'openai/o4-mini',
  O4MiniDeepResearch = 'openai/o4-mini-deep-research',
  O3Mini = 'openai/o3-mini',
  O3MiniHigh = 'openai/o3-mini-high',
  O4MiniHigh = 'openai/o4-mini-high',
  O1 = 'openai/o1',
  O1Mini = 'openai/o1-mini',
  O1Pro = 'openai/o1-pro',
  GptOss120bOpenAi = 'openai/gpt-oss-120b',
  GptOss20bOpenAi = 'openai/gpt-oss-20b',
  // xAI (Grok) — the REST API (`/ai/v1`) routes xAI models under the `xai/`
  // prefix. `grok/` only applies to the native gateway.ai.cloudflare.com path.
  Grok47 = 'xai/grok-4.7',
  Grok46 = 'xai/grok-4.6',
  Grok45 = 'xai/grok-4.5',
  Grok43 = 'xai/grok-4.3',
  Grok420Reasoning = 'xai/grok-4.20-0309-reasoning',
  Grok420NonReasoning = 'xai/grok-4.20-0309-non-reasoning',
  Grok420MultiAgent = 'xai/grok-4.20-multi-agent-0309',
  // Groq
  Llama38b8192 = 'groq/llama-3-8b-8192',
  Llama370b8192 = 'groq/llama-3-70b-8192',
  Llama318b8192 = 'groq/llama-3-1-8b-8192',
  Llama3170b8192 = 'groq/llama-3-1-70b-8192',
  Llama31405b8192 = 'groq/llama-3-1-405b-8192',
  Llama3370b = 'groq/llama-3-3-70b',
  Mixtral8x7b32768 = 'groq/mixtral-8x7b-32768',
  Gemma227bIt = 'groq/gemma-2-27b-it',
  Gemma7bIt = 'groq/gemma-7b-it',
  // Mistral
  MistralNemo = 'mistral/mistral-nemo',
  MistralSmall = 'mistral/mistral-small',
  MistralMedium = 'mistral/mistral-medium',
  MistralLarge = 'mistral/mistral-large',
  MistralSaba = 'mistral/mistral-saba',
  Pixtral15b = 'mistral/pixtral-15b',
  MistralTiny = 'mistral/mistral-tiny',
  MistralSmall32b = 'mistral/mistral-small-32b',
  MistralLarge2407 = 'mistral/mistral-large-2407',
  // Cohere
  CommandRPlus = 'cohere/command-r-plus',
  CommandR = 'cohere/command-r',
  CommandLight = 'cohere/command-light',
  Command = 'cohere/command',
  EmbedEnglishV3 = 'cohere/embed-english-v3',
  EmbedMultilingualV3 = 'cohere/embed-multilingual-v3',
  // Perplexity
  Llama38b8192Perplexity = 'perplexity/llama-3-8b-8192',
  Llama3170b8192Perplexity = 'perplexity/llama-3-1-70b-8192',
  SonarSmallChat = 'perplexity/sonar-small-chat',
  SonarSmallOnline = 'perplexity/sonar-small-online',
  SonarMediumChat = 'perplexity/sonar-medium-chat',
  SonarMediumOnline = 'perplexity/sonar-medium-online',
  SonarProChat = 'perplexity/sonar-pro-chat',
  SonarProOnline = 'perplexity/sonar-pro-online',
  R1170b = 'perplexity/r1-170b',
  // Workers AI
  Llama318bInstruct = 'workers-ai/@cf/meta/llama-3-1-8b-instruct',
  Llama3170bInstruct = 'workers-ai/@cf/meta/llama-3-1-70b-instruct',
  Llama38bInstruct = 'workers-ai/@cf/meta/llama-3-8b-instruct',
  Llama370bInstruct = 'workers-ai/@cf/meta/llama-3-70b-instruct',
  Gemma29bItWorkersAi = 'workers-ai/@cf/google/gemma-2-9b-it',
  Gemma7bItWorkersAi = 'workers-ai/@cf/google/gemma-7b-it',
  Phi2 = 'workers-ai/@cf/microsoft/phi-2',
  Qwen25Coder32b = 'workers-ai/@cf/qwen/qwen2-5-coder-32b',
  DistilbertSst2Int8 = 'workers-ai/@cf/huggingface/distilbert-sst-2-int8',
  BgeLargeEn15 = 'workers-ai/@cf/bge/large-en-1.5',
  KimiK26WorkersAi = 'workers-ai/@cf/moonshotai/kimi-k2.6',
  KimiK27CodeWorkersAi = 'workers-ai/@cf/moonshotai/kimi-k2.7-code',
  Glm52 = 'workers-ai/@cf/zai-org/glm-5.2',
  DeepseekV4ProWorkersAi = 'workers-ai/@cf/deepseek-ai/deepseek-v4-pro-0813',
  DeepseekV4FlashWorkersAi = 'workers-ai/@cf/deepseek-ai/deepseek-v4-flash-0731',
  // DeepSeek
  DeepseekChat = 'deepseek/deepseek-chat',
  DeepseekCoder = 'deepseek/deepseek-coder',
  DeepseekR1 = 'deepseek/deepseek-r1',
  DeepseekV3 = 'deepseek/deepseek-v3',
  DeepseekV4Pro = 'deepseek/deepseek-v4-pro',
  // Cerebras
  Llama318b = 'cerebras/llama3.1-8b',
  Llama3170b = 'cerebras/llama3.1-70b',
  Llama38b = 'cerebras/llama3-8b',
  Llama370b = 'cerebras/llama3-70b',
  Gemma7b = 'cerebras/gemma-7b',
  // Baseten
  GptOss120b = 'baseten/openai/gpt-oss-120b',
  GptOss32b = 'baseten/openai/gpt-oss-32b',
  GptOss16b = 'baseten/openai/gpt-oss-16b',
  GptOss4b = 'baseten/openai/gpt-oss-4b',
  // Parallel
  ParallelSpeed = 'parallel/speed',
  ParallelReason = 'parallel/reason',
  ParallelSearch = 'parallel/search',
  ParallelFindall = 'parallel/findall',
  // Alibaba (Qwen)
  Qwen38Max = 'alibaba/qwen3.8-max',
  Qwen37Max = 'alibaba/qwen3.7-max',
  Qwen37Plus = 'alibaba/qwen3.7-plus',
  Qwen35_397bA17b = 'alibaba/qwen3.5-397b-a17b',
  Qwen3Max = 'alibaba/qwen3-max',
  // Moonshot AI
  KimiK26 = 'moonshotai/kimi-k2.6',
  KimiK27Code = 'moonshotai/kimi-k2.7-code',
  KimiK3 = 'moonshotai/kimi-k3',
  // MiniMax
  MiniMaxM3 = 'minimax/m3',
  MiniMaxM27 = 'minimax/m2.7',
}

export const DEFAULT_MODEL_REF = `${PROVIDER_ID}/${CloudflareUnifiedBillingModel.ClaudeSonnet46}`;

const googleModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.Gemini38Flash,
    name: 'Gemini 3.8 Flash',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.75, output: 3.75, cacheRead: 0.075, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini37Flash,
    name: 'Gemini 3.7 Flash',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.75, output: 3.75, cacheRead: 0.075, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini36Flash,
    name: 'Gemini 3.6 Flash',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.825, output: 4.125, cacheRead: 0.0825, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini35Flash,
    name: 'Gemini 3.5 Flash',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini35FlashLite,
    name: 'Gemini 3.5 Flash Lite',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini31Pro,
    name: 'Gemini 3.1 Pro',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 2.0, output: 12.0, cacheRead: 0.2, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini3Flash,
    name: 'Gemini 3 Flash',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 8192,
    cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini31FlashLite,
    name: 'Gemini 3.1 Flash Lite',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.25, output: 1.5, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini31FlashImagePreview,
    name: 'Gemini 3.1 Flash Image Preview',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 131072,
    maxTokens: 32768,
    cost: { input: 0.25, output: 1.5, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini31ProPreview,
    name: 'Gemini 3.1 Pro Preview',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 2.0, output: 12.0, cacheRead: 0.2, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini3FlashPreview,
    name: 'Gemini 3 Flash Preview',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini3ProPreview,
    name: 'Gemini 3 Pro Preview',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 2.0, output: 12.0, cacheRead: 0.2, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini25Pro,
    name: 'Gemini 2.5 Pro',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.625, output: 5.0, cacheRead: 0.0625, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini25Flash,
    name: 'Gemini 2.5 Flash',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 65536,
    cost: { input: 0.15, output: 1.25, cacheRead: 0.015, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini25FlashLite,
    name: 'Gemini 2.5 Flash Lite',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 8192,
    cost: { input: 0.05, output: 0.2, cacheRead: 0.005, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini20Flash,
    name: 'Gemini 2.0 Flash',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini15Pro,
    name: 'Gemini 1.5 Pro',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 2097152,
    maxTokens: 8192,
    cost: { input: 1.25, output: 5.0, cacheRead: 0.3125, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini15Flash,
    name: 'Gemini 1.5 Flash',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 8192,
    cost: { input: 0.075, output: 0.3, cacheRead: 0.01875, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemini15Flash8b,
    name: 'Gemini 1.5 Flash 8B',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 8192,
    cost: { input: 0.0375, output: 0.15, cacheRead: 0.01, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma426bA4bIt,
    name: 'Gemma 4 26B A4B IT',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 262144,
    maxTokens: 32768,
    cost: { input: 0.042, output: 0.22, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma312bIt,
    name: 'Gemma 3 12B IT',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 131072,
    maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma327bIt,
    name: 'Gemma 3 27B IT',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 131072,
    maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma29bIt,
    name: 'Gemma 2 9B IT',

    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 4096,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
];

const anthropicModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.ClaudeOpus55,
    name: 'Claude Opus 5.5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 128000,
    cost: { input: 4.0, output: 20.0, cacheRead: 0.2, cacheWrite: 5.0 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeOpus5,
    name: 'Claude Opus 5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 128000,
    cost: { input: 5.0, output: 25.0, cacheRead: 0.5, cacheWrite: 6.25 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeSonnet5,
    name: 'Claude Sonnet 5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 128000,
    cost: { input: 2.0, output: 10.0, cacheRead: 0.2, cacheWrite: 2.5 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeFable5,
    name: 'Claude Fable 5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 128000,
    cost: { input: 10.0, output: 50.0, cacheRead: 1.0, cacheWrite: 12.5 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeFable51,
    name: 'Claude Fable 5.1',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 128000,
    cost: { input: 10.0, output: 50.0, cacheRead: 1.0, cacheWrite: 12.5 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeOpus48,
    name: 'Claude Opus 4.8',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 32000,
    cost: { input: 5.0, output: 25.0, cacheRead: 0.5, cacheWrite: 6.25 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeOpus47,
    name: 'Claude Opus 4.7',
    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 32000,
    cost: { input: 5.0, output: 25.0, cacheRead: 0.5, cacheWrite: 6.25 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeOpus46,
    name: 'Claude Opus 4.6',
    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 32000,
    cost: { input: 5.0, output: 25.0, cacheRead: 0.5, cacheWrite: 6.25 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeOpus45,
    name: 'Claude Opus 4.5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 32000,
    cost: { input: 5.0, output: 25.0, cacheRead: 0.5, cacheWrite: 6.25 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeSonnet46,
    name: 'Claude Sonnet 4.6',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 64000,
    cost: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeSonnet45,
    name: 'Claude Sonnet 4.5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 64000,
    cost: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  },
  {
    id: CloudflareUnifiedBillingModel.ClaudeHaiku45,
    name: 'Claude Haiku 4.5',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 16000,
    cost: { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 },
  },
];

const openaiModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.Gpt6Astra,
    name: 'GPT-6 Astra',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 128000,
    cost: { input: 10.0, output: 50.0, cacheRead: 1.0, cacheWrite: 12.5 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt6Sol,
    name: 'GPT-6 Sol',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 128000,
    cost: { input: 2.0, output: 10.0, cacheRead: 0.2, cacheWrite: 2.5 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt6Luna,
    name: 'GPT-6 Luna',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 128000,
    cost: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt56Sol,
    name: 'GPT-5.6 Sol',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 128000,
    cost: { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt56Terra,
    name: 'GPT-5.6 Terra',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 128000,
    cost: { input: 2.0, output: 12.0, cacheRead: 0.2, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt56Luna,
    name: 'GPT-5.6 Luna',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 128000,
    cost: { input: 0.2, output: 1.2, cacheRead: 0.02, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt54,
    name: 'GPT-5.4',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 16384,
    cost: { input: 2.5, output: 15.0, cacheRead: 0.25, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt54Pro,
    name: 'GPT-5.4 Pro',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 16384,
    cost: { input: 30.0, output: 180.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt51,
    name: 'GPT-5.1',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 400000,
    maxTokens: 16384,
    cost: { input: 0.625, output: 5.0, cacheRead: 0.0625, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt55,
    name: 'GPT-5.5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 16384,
    cost: { input: 2.5, output: 15.0, cacheRead: 0.25, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt55Pro,
    name: 'GPT-5.5 Pro',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1050000,
    maxTokens: 128000,
    cost: { input: 5.0, output: 30.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt54Mini,
    name: 'GPT-5.4 Mini',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 400000,
    maxTokens: 16384,
    cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt54Nano,
    name: 'GPT-5.4 Nano',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 400000,
    maxTokens: 16384,
    cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt52,
    name: 'GPT-5.2',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 1.75, output: 14.0, cacheRead: 0.175, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt5,
    name: 'GPT-5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 1.25, output: 10.0, cacheRead: 0.125, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt5Pro,
    name: 'GPT-5 Pro',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 15.0, output: 120.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt5Mini,
    name: 'GPT-5 Mini',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 0.125, output: 1.0, cacheRead: 0.0125, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt5Nano,
    name: 'GPT-5 Nano',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 0.05, output: 0.4, cacheRead: 0.005, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt41,
    name: 'GPT-4.1',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1047576,
    maxTokens: 32768,
    cost: { input: 2.0, output: 8.0, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt41Mini,
    name: 'GPT-4.1 Mini',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1047576,
    maxTokens: 32768,
    cost: { input: 0.4, output: 1.6, cacheRead: 0.1, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt41Nano,
    name: 'GPT-4.1 Nano',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 1047576,
    maxTokens: 32768,
    cost: { input: 0.05, output: 0.2, cacheRead: 0.0125, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt4o,
    name: 'GPT-4o',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 2.5, output: 10.0, cacheRead: 1.25, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gpt4oMini,
    name: 'GPT-4o Mini',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.CodexMini,
    name: 'Codex Mini',

    reasoning: false,
    input: ['text'],
    contextWindow: 16384,
    maxTokens: 4096,
    cost: { input: 1.5, output: 6.0, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O3,
    name: 'o3',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 2.0, output: 8.0, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O3Pro,
    name: 'o3-pro',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 20.0, output: 80.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O3DeepResearch,
    name: 'o3-deep-research',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 10.0, output: 40.0, cacheRead: 2.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O4Mini,
    name: 'o4-mini',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 1.1, output: 4.4, cacheRead: 0.275, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O4MiniDeepResearch,
    name: 'o4-mini-deep-research',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 2.0, output: 8.0, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O3Mini,
    name: 'o3-mini',

    reasoning: true,
    input: ['text'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 0.55, output: 2.2, cacheRead: 0.275, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O3MiniHigh,
    name: 'o3-mini-high',

    reasoning: true,
    input: ['text'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O4MiniHigh,
    name: 'o4-mini-high',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O1,
    name: 'o1',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 15.0, output: 60.0, cacheRead: 7.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O1Pro,
    name: 'o1-pro',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 200000,
    maxTokens: 100000,
    cost: { input: 150.0, output: 600.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.O1Mini,
    name: 'o1-mini',

    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 65536,
    cost: { input: 0.55, output: 2.2, cacheRead: 0.275, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.GptOss120bOpenAi,
    name: 'GPT-OSS 120B',

    reasoning: true,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 32768,
    cost: { input: 0.03, output: 0.17, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.GptOss20bOpenAi,
    name: 'GPT-OSS 20B',

    reasoning: true,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 32768,
    cost: { input: 0.018, output: 0.09, cacheRead: 0, cacheWrite: 0 },
  },
];

const xaiModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.Grok47,
    name: 'Grok 4.7',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 500000,
    maxTokens: 32768,
    cost: { input: 2.0, output: 6.0, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Grok46,
    name: 'Grok 4.6',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 500000,
    maxTokens: 32768,
    cost: { input: 2.0, output: 6.0, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Grok45,
    name: 'Grok 4.5',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 500000,
    maxTokens: 32768,
    cost: { input: 2.0, output: 6.0, cacheRead: 0.5, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Grok43,
    name: 'Grok 4.3',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 32768,
    cost: { input: 1.25, output: 2.5, cacheRead: 0.3125, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Grok420Reasoning,
    name: 'Grok 4.20 Reasoning',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 2000000,
    maxTokens: 32768,
    cost: { input: 2.5, output: 5.0, cacheRead: 0.625, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Grok420NonReasoning,
    name: 'Grok 4.20',

    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 2000000,
    maxTokens: 32768,
    cost: { input: 2.5, output: 5.0, cacheRead: 0.625, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Grok420MultiAgent,
    name: 'Grok 4.20 Multi-Agent',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 2000000,
    maxTokens: 32768,
    cost: { input: 1.25, output: 2.5, cacheRead: 0.3125, cacheWrite: 0 },
  },
];

const groqModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.Llama38b8192,
    name: 'Llama 3 8B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.05, output: 0.05, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama370b8192,
    name: 'Llama 3 70B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.59, output: 0.79, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama318b8192,
    name: 'Llama 3.1 8B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.05, output: 0.05, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama3170b8192,
    name: 'Llama 3.1 70B',
    reasoning: false,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 8192,
    cost: { input: 0.59, output: 0.79, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama31405b8192,
    name: 'Llama 3.1 405B',
    reasoning: false,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 4096,
    cost: { input: 5.0, output: 5.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama3370b,
    name: 'Llama 3.3 70B',
    reasoning: false,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 8192,
    cost: { input: 0.59, output: 0.79, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Mixtral8x7b32768,
    name: 'Mixtral 8x7B',
    reasoning: false,
    input: ['text'],
    contextWindow: 32768,
    maxTokens: 32768,
    cost: { input: 0.24, output: 0.24, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma227bIt,
    name: 'Gemma 2 27B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.8, output: 0.8, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma7bIt,
    name: 'Gemma 7B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 },
  },
];

const mistralModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.MistralNemo,
    name: 'Mistral Nemo',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 32768,
    cost: { input: 0.15, output: 0.15, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MistralSmall,
    name: 'Mistral Small',
    reasoning: false,
    input: ['text'],
    contextWindow: 32000,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MistralMedium,
    name: 'Mistral Medium',
    reasoning: false,
    input: ['text'],
    contextWindow: 32000,
    maxTokens: 8192,
    cost: { input: 2.7, output: 8.1, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MistralLarge,
    name: 'Mistral Large',
    reasoning: true,
    input: ['text'],
    contextWindow: 32000,
    maxTokens: 8192,
    cost: { input: 8.0, output: 24.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MistralSaba,
    name: 'Mistral Saba',
    reasoning: false,
    input: ['text'],
    contextWindow: 32000,
    maxTokens: 8192,
    cost: { input: 0.2, output: 0.6, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Pixtral15b,
    name: 'Pixtral 15B',
    reasoning: false,
    input: ['text', 'image'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.15, output: 0.15, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MistralTiny,
    name: 'Mistral Tiny',
    reasoning: false,
    input: ['text'],
    contextWindow: 32000,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MistralSmall32b,
    name: 'Mistral Small 32B',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 32768,
    cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MistralLarge2407,
    name: 'Mistral Large 2407',
    reasoning: true,
    input: ['text'],
    contextWindow: 32000,
    maxTokens: 8192,
    cost: { input: 8.0, output: 24.0, cacheRead: 0, cacheWrite: 0 },
  },
];

const cohereModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.CommandRPlus,
    name: 'Command R+',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 128000,
    cost: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.CommandR,
    name: 'Command R',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 128000,
    cost: { input: 0.5, output: 1.5, cacheRead: 0.1, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.CommandLight,
    name: 'Command Light',
    reasoning: false,
    input: ['text'],
    contextWindow: 4096,
    maxTokens: 4096,
    cost: { input: 0.3, output: 0.6, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Command,
    name: 'Command',
    reasoning: false,
    input: ['text'],
    contextWindow: 4096,
    maxTokens: 4096,
    cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.EmbedEnglishV3,
    name: 'Embed English 3',
    reasoning: false,
    input: ['text'],
    contextWindow: 1024,
    maxTokens: 1024,
    cost: { input: 0.06, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.EmbedMultilingualV3,
    name: 'Embed Multilingual 3',
    reasoning: false,
    input: ['text'],
    contextWindow: 1024,
    maxTokens: 1024,
    cost: { input: 0.06, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
];

const perplexityModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.Llama38b8192Perplexity,
    name: 'Llama 3 8B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.2, output: 0.2, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama3170b8192Perplexity,
    name: 'Llama 3.1 70B',
    reasoning: false,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 16384,
    cost: { input: 0.9, output: 0.9, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.SonarSmallChat,
    name: 'Sonar Small Chat',
    reasoning: false,
    input: ['text'],
    contextWindow: 16000,
    maxTokens: 4096,
    cost: { input: 0.2, output: 0.2, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.SonarSmallOnline,
    name: 'Sonar Small Online',
    reasoning: false,
    input: ['text'],
    contextWindow: 16000,
    maxTokens: 4096,
    cost: { input: 1.0, output: 1.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.SonarMediumChat,
    name: 'Sonar Medium Chat',
    reasoning: false,
    input: ['text'],
    contextWindow: 16000,
    maxTokens: 4096,
    cost: { input: 2.0, output: 2.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.SonarMediumOnline,
    name: 'Sonar Medium Online',
    reasoning: false,
    input: ['text'],
    contextWindow: 16000,
    maxTokens: 4096,
    cost: { input: 5.0, output: 5.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.SonarProChat,
    name: 'Sonar Pro Chat',
    reasoning: false,
    input: ['text'],
    contextWindow: 16000,
    maxTokens: 4096,
    cost: { input: 5.0, output: 5.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.SonarProOnline,
    name: 'Sonar Pro Online',
    reasoning: false,
    input: ['text'],
    contextWindow: 16000,
    maxTokens: 4096,
    cost: { input: 10.0, output: 10.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.R1170b,
    name: 'R1 170B',
    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 2.7, output: 8.1, cacheRead: 0, cacheWrite: 0 },
  },
];

const workersAiModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.KimiK26WorkersAi,
    name: 'Kimi K2.6',

    reasoning: true,
    input: ['text'],
    contextWindow: 262144,
    maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.KimiK27CodeWorkersAi,
    name: 'Kimi K2.7 Code',

    reasoning: true,
    input: ['text'],
    contextWindow: 262144,
    maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Glm52,
    name: 'GLM 5.2',

    reasoning: true,
    input: ['text'],
    contextWindow: 262144,
    maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.DeepseekV4ProWorkersAi,
    name: 'DeepSeek V4 Pro (Workers AI)',

    reasoning: true,
    input: ['text'],
    contextWindow: 1048576,
    maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.DeepseekV4FlashWorkersAi,
    name: 'DeepSeek V4 Flash (Workers AI)',

    reasoning: true,
    input: ['text'],
    contextWindow: 1048576,
    maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama318bInstruct,
    name: 'Llama 3.1 8B Instruct',
    reasoning: false,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama3170bInstruct,
    name: 'Llama 3.1 70B Instruct',
    reasoning: false,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama38bInstruct,
    name: 'Llama 3 8B Instruct',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama370bInstruct,
    name: 'Llama 3 70B Instruct',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma29bIt,
    name: 'Gemma 2 9B IT',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma7bIt,
    name: 'Gemma 7B IT',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Phi2,
    name: 'Phi-2',
    reasoning: false,
    input: ['text'],
    contextWindow: 2048,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Qwen25Coder32b,
    name: 'Qwen 2.5 Coder 32B',
    reasoning: false,
    input: ['text'],
    contextWindow: 32768,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.DistilbertSst2Int8,
    name: 'DistilBERT SST-2 Int8',
    reasoning: false,
    input: ['text'],
    contextWindow: 512,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.BgeLargeEn15,
    name: 'BGE Large EN 1.5',
    reasoning: false,
    input: ['text'],
    contextWindow: 512,
    maxTokens: 128,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
];

const deepseekModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.DeepseekV4Pro,
    name: 'DeepSeek V4 Pro',

    reasoning: true,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 65536,
    cost: { input: 0.7, output: 2.96, cacheRead: 0.07, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.DeepseekChat,
    name: 'DeepSeek Chat',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.14, output: 0.28, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.DeepseekCoder,
    name: 'DeepSeek Coder',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.14, output: 0.28, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.DeepseekR1,
    name: 'DeepSeek R1',
    reasoning: true,
    input: ['text'],
    contextWindow: 160000,
    maxTokens: 16384,
    cost: { input: 1.34, output: 5.36, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.DeepseekV3,
    name: 'DeepSeek V3',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.5, output: 1.0, cacheRead: 0, cacheWrite: 0 },
  },
];

const cerebrasModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.Llama318b,
    name: 'Llama 3.1 8B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama3170b,
    name: 'Llama 3.1 70B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.6, output: 0.6, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama38b,
    name: 'Llama 3 8B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Llama370b,
    name: 'Llama 3 70B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.6, output: 0.6, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Gemma7b,
    name: 'Gemma 7B',
    reasoning: false,
    input: ['text'],
    contextWindow: 8192,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 },
  },
];

const basetenModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.GptOss120b,
    name: 'GPT-OSS 120B',
    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 3.0, output: 12.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.GptOss32b,
    name: 'GPT-OSS 32B',
    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.8, output: 3.2, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.GptOss16b,
    name: 'GPT-OSS 16B',
    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.4, output: 1.6, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.GptOss4b,
    name: 'GPT-OSS 4B',
    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.1, output: 0.4, cacheRead: 0, cacheWrite: 0 },
  },
];

const parallelModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.ParallelSpeed,
    name: 'Parallel Speed',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 0.5, output: 2.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.ParallelReason,
    name: 'Parallel Reason',
    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 5.0, output: 20.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.ParallelSearch,
    name: 'Parallel Search',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 5.0, output: 20.0, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.ParallelFindall,
    name: 'Parallel FindAll',
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 8192,
    cost: { input: 5.0, output: 20.0, cacheRead: 0, cacheWrite: 0 },
  },
];

const alibabaModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.Qwen38Max,
    name: 'Qwen 3.8 Max',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 65536,
    cost: { input: 2.0, output: 6.0, cacheRead: 0.25, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Qwen37Max,
    name: 'Qwen 3.7 Max',

    reasoning: true,
    input: ['text'],
    contextWindow: 1000000,
    maxTokens: 65536,
    cost: { input: 2.5, output: 7.5, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Qwen37Plus,
    name: 'Qwen 3.7 Plus',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1000000,
    maxTokens: 65536,
    cost: { input: 0.32, output: 1.28, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Qwen35_397bA17b,
    name: 'Qwen 3.5 397B A17B',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 262144,
    maxTokens: 32768,
    cost: { input: 0.5, output: 3.6, cacheRead: 0.3, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.Qwen3Max,
    name: 'Qwen 3 Max',

    reasoning: false,
    input: ['text'],
    contextWindow: 262144,
    maxTokens: 32768,
    cost: { input: 1.2, output: 6.0, cacheRead: 0, cacheWrite: 0 },
  },
];

const moonshotModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.KimiK26,
    name: 'Kimi K2.6',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 262144,
    maxTokens: 32768,
    cost: { input: 0.471, output: 2.835, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.KimiK27Code,
    name: 'Kimi K2.7 Code',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 262144,
    maxTokens: 32768,
    cost: { input: 0.68, output: 3.4, cacheRead: 0, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.KimiK3,
    name: 'Kimi K3',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 131072,
    cost: { input: 1.7, output: 8.5, cacheRead: 0.17, cacheWrite: 0 },
  },
];

const minimaxModels: ModelDefinitionConfig[] = [
  {
    id: CloudflareUnifiedBillingModel.MiniMaxM3,
    name: 'MiniMax M3',

    reasoning: true,
    input: ['text', 'image'],
    contextWindow: 1048576,
    maxTokens: 4096,
    cost: { input: 0.23, output: 0.96, cacheRead: 0.046, cacheWrite: 0 },
  },
  {
    id: CloudflareUnifiedBillingModel.MiniMaxM27,
    name: 'MiniMax M2.7',

    reasoning: true,
    input: ['text'],
    contextWindow: 131072,
    maxTokens: 4096,
    cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0 },
  },
];

export const ALL_MODELS: ModelDefinitionConfig[] = [
  ...googleModels,
  ...anthropicModels,
  ...openaiModels.map((m) =>
    Object.assign({ ...m, params: { max_completion_tokens: m.maxTokens } }),
  ),
  ...xaiModels,
  ...groqModels,
  ...mistralModels,
  ...cohereModels,
  ...perplexityModels,
  ...workersAiModels,
  ...deepseekModels,
  ...cerebrasModels,
  ...basetenModels,
  ...parallelModels,
  ...alibabaModels,
  ...moonshotModels,
  ...minimaxModels,
];

/**
 * Normalize a user-supplied AI Gateway custom domain (for example
 * `ai.example.com`) into a bare hostname. Accepts bare hosts, `host:port`
 * values, and fully-qualified `https://host` URLs, and returns `undefined` for
 * anything that is not a usable hostname.
 */
export function normalizeCustomDomain(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  let host: string;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    try {
      host = new URL(trimmed).host;
    } catch {
      return undefined;
    }
  } else {
    host = trimmed;
  }

  host = host.replace(/\/+$/, '');
  if (!host || host.includes('/') || host.includes('@') || host.includes(' ')) {
    return undefined;
  }
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) {
    return undefined;
  }
  return host;
}

/**
 * Extract a custom-domain hostname from a configured base URL. Returns
 * `undefined` for the default Cloudflare REST endpoint, which is not a custom
 * domain.
 */
export function customDomainFromBaseUrl(baseUrl: unknown): string | undefined {
  const host = normalizeCustomDomain(baseUrl);
  if (!host) return undefined;
  const bare = host.split(':')[0]?.toLowerCase();
  if (bare === 'api.cloudflare.com' || bare === 'gateway.ai.cloudflare.com') {
    return undefined;
  }
  return host;
}

/**
 * Resolve the AI Gateway base URL for the provider.
 *
 * When a custom domain is configured, requests are routed through the AI
 * Gateway endpoint (`https://<domain>/compat`) instead of the Cloudflare REST
 * API. Custom domains are the foundation for identity-aware controls: putting
 * one behind Cloudflare Access makes AI Gateway attach the verified Access
 * subject as `cf.user_id`, which the User Insights dashboard uses to attribute
 * spend to individual identities. Custom domains are not served by
 * `api.cloudflare.com`.
 */
export function resolveBaseUrl(params: {
  accountId?: string;
  gatewayId?: string;
  customDomain?: string;
}): string {
  const customDomain = normalizeCustomDomain(params.customDomain);
  if (customDomain) {
    return `https://${customDomain}/compat`;
  }
  return `https://api.cloudflare.com/client/v4/accounts/${params.accountId}/ai/v1`;
}

export type AgentModelConfig = {
  primary: string;
  fallbacks?: string[];
};

export function agentModel(
  primary: CloudflareUnifiedBillingModel,
  fallbacks?: CloudflareUnifiedBillingModel[],
): AgentModelConfig {
  return {
    primary: `${PROVIDER_ID}/${primary}`,
    fallbacks: fallbacks?.map((f) => `${PROVIDER_ID}/${f}`),
  };
}
