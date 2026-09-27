import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
describe('diag2', () => {
  it('captures execSync error', () => {
    try {
      const r = execSync('openclaw --version', {
        encoding: 'utf-8',
        timeout: 8000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      console.log('openclaw --version OK:', r.trim());
    } catch (e: any) {
      console.log('FAILED message:', e.message);
      console.log('FAILED status:', e.status);
      console.log('FAILED stdout:', JSON.stringify(e.stdout));
      console.log('FAILED stderr:', JSON.stringify(e.stderr));
    }
    expect(true).toBe(true);
  }, 30000);
});
