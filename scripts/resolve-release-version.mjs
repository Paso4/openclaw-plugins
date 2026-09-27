#!/usr/bin/env bun
/**
 * resolve-release-version.mjs
 *
 * Computes the next global release version. The base always tracks the
 * compatible OpenClaw version (root `catalog.openclaw`); when that base has
 * already been released, a `-N` build suffix is appended so multiple plugin
 * releases can ship against the same OpenClaw version.
 *
 * Examples:
 *   catalog.openclaw = ^2026.9.6, no tags           -> 2026.9.6
 *   v2026.9.6 exists                                 -> 2026.9.6-2
 *   v2026.9.6 and v2026.9.6-2 exist                  -> 2026.9.6-3
 */
import { spawnSync } from 'node:child_process';
import { execFileSync } from 'node:child_process';

function openclawVersion() {
  return execFileSync('bun', ['scripts/openclaw-version.mjs'], { encoding: 'utf-8' }).trim();
}

function tagExists(tag) {
  const result = spawnSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], {
    stdio: 'ignore',
  });
  return result.status === 0;
}

const base = openclawVersion();
if (!tagExists(`v${base}`)) {
  console.log(base);
  process.exit(0);
}

for (let n = 2; n < 1000; n++) {
  const candidate = `${base}-${n}`;
  if (!tagExists(`v${candidate}`)) {
    console.log(candidate);
    process.exit(0);
  }
}

console.error(`Could not resolve a free release version for base ${base}.`);
process.exit(1);
