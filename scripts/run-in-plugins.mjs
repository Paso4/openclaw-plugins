#!/usr/bin/env bun
/**
 * run-in-plugins.mjs <script> [--filter <name>] [--continue]
 *
 * Runs an npm script inside every plugin that declares it. Plugins without the
 * script are skipped (so e.g. a plugin with no integration suite is a no-op for
 * `test:integration`). Exits non-zero if any plugin's script fails.
 *
 * Used by the root `test`, `test:integration`, `typecheck`, and `build` scripts.
 */
import { spawnSync } from 'node:child_process';
import { listPlugins, REPO_ROOT } from './list-plugins.mjs';

const [script, ...rest] = process.argv.slice(2);
if (!script) {
  console.error('usage: bun scripts/run-in-plugins.mjs <script> [--filter <name>] [--continue]');
  process.exit(2);
}

const filterIdx = rest.indexOf('--filter');
const filter = filterIdx === -1 ? '' : (rest[filterIdx + 1] ?? '');
const keepGoing = rest.includes('--continue');

let plugins = listPlugins();
if (filter) plugins = plugins.filter((p) => p.name === filter || p.packageName === filter);

const runnable = plugins.filter((p) => typeof p.scripts[script] === 'string');
const skipped = plugins.filter((p) => typeof p.scripts[script] !== 'string');

if (runnable.length === 0) {
  console.log(`No plugin declares a "${script}" script — nothing to do.`);
  process.exit(0);
}

console.log(`Running "${script}" in ${runnable.length} plugin(s):`);
for (const p of runnable) console.log(`  - ${p.dir}`);
if (skipped.length) {
  console.log(`Skipped (no "${script}" script): ${skipped.map((p) => p.dir).join(', ')}`);
}

let failed = 0;
for (const plugin of runnable) {
  console.log(`\n=== ${plugin.dir} :: ${script} ===`);
  const result = spawnSync('bun', ['run', '--cwd', plugin.dir, script], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    failed += 1;
    console.error(`\n!!! ${plugin.dir} failed "${script}" (exit ${result.status ?? 'signal'})`);
    if (!keepGoing) break;
  }
}

if (failed > 0) process.exit(1);
