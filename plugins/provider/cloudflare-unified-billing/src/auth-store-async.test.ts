import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Focused coverage for the awaited auth-profile migration
// (`auth-profile-sync-operations`, final compatibility day 2026-12-31). Kept in
// its own file so the shared `auth-method-v2` suite stays conflict-free.
describe('cloudflare-unified-billing awaited auth-store migration', () => {
  const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

  it('awaits the runtime auth loader for catalog profile discovery', () => {
    // Secret-read preparation runs on the auth owner's worker (read-only, no
    // keychain prompt) instead of synchronously on the Gateway thread.
    expect(indexContent).toMatch(/loadAuthProfileStoreForRuntimeAsync/);
    expect(indexContent).toMatch(/readOnly:\s*true/);
    expect(indexContent).toMatch(/allowKeychainPrompt:\s*false/);
  });

  it('imports the awaited loader from the agent-runtime subpath', () => {
    expect(indexContent).toMatch(
      /loadAuthProfileStoreForRuntimeAsync[^}]*\}\s*from\s*['"]openclaw\/plugin-sdk\/agent-runtime['"]/,
    );
  });

  it('retains the synchronous loader only for the sync host resolver', () => {
    // `normalizeResolvedModel` cannot await; the synchronous loader stays
    // through the 2026-12-31 compatibility window.
    expect(indexContent).toMatch(/ensureAuthProfileStore/);
    expect(indexContent).toMatch(/normalizeResolvedModel/);
  });
});
