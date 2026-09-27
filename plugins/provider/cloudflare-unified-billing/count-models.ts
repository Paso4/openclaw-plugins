import { ALL_MODELS } from './src/models.js';
console.log('Total models:', ALL_MODELS.length);
console.log('Models by provider:');
const providers = new Map<string, number>();
for (const model of ALL_MODELS) {
  const provider = model.id.split('/')[0] ?? 'unknown';
  providers.set(provider, (providers.get(provider) || 0) + 1);
}
for (const [provider, count] of providers) {
  console.log(`  ${provider}: ${count}`);
}
