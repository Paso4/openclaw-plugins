#!/usr/bin/env bun
/**
 * resolve-release-version.mjs
 *
 * Computes the next global release version. The base always tracks the
 * compatible OpenClaw version (root `catalog.openclaw`); when that base has
 * already been released, a `-N` build suffix is appended so multiple plugin
 * releases can ship against the same OpenClaw version.
 *
 * A version is considered "taken" when it is either a git tag (`v<version>`) or
 * already published to ClawHub for any plugin. Checking the registry matters
 * because a plugin can be published by a manual `workflow_dispatch` without a
 * tag ever being created; resolving from tags alone would then reuse a version
 * ClawHub already has.
 *
 * Examples:
 *   catalog.openclaw = ^2026.9.6, nothing released   -> 2026.9.6
 *   v2026.9.6 or ClawHub 2026.9.6 exists             -> 2026.9.6-2
 *   ... and 2026.9.6-2 is taken                      -> 2026.9.6-3
 *
 * Set RELEASE_VERSION_SKIP_REGISTRY=true to resolve from git tags only (used
 * offline); the registry lookup already degrades to a warning on failure.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listPlugins, REPO_ROOT } from './list-plugins.mjs';

function openclawVersion() {
  return execFileSync('bun', ['scripts/openclaw-version.mjs'], {
    encoding: 'utf-8',
    cwd: REPO_ROOT,
  }).trim();
}

function tagExists(tag) {
  const result = spawnSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], {
    stdio: 'ignore',
  });
  return result.status === 0;
}

const CLAWHUB_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'clawhub');

/**
 * Published ClawHub versions for a package. Returns [] when the package is
 * unknown, the registry is unreachable, or the lookup is skipped.
 */
function publishedVersions(packageName) {
  const result = spawnSync(
    CLAWHUB_BIN,
    ['package', 'inspect', packageName, '--versions', '--json'],
    { cwd: REPO_ROOT, encoding: 'utf-8', timeout: 30_000 },
  );
  if (result.status !== 0 || !result.stdout) {
    const stderr = (result.stderr ?? '').trim();
    if (stderr && !/not found/i.test(stderr)) {
      console.error(`ClawHub version lookup for ${packageName} failed: ${stderr}`);
    }
    return [];
  }
  const start = result.stdout.indexOf('{');
  if (start === -1) return [];
  try {
    const parsed = JSON.parse(result.stdout.slice(start));
    return (parsed.versions ?? []).map((entry) => entry.version).filter(Boolean);
  } catch {
    return [];
  }
}

function publishedReleaseVersions() {
  if (process.env.RELEASE_VERSION_SKIP_REGISTRY === 'true') return new Set();
  if (!existsSync(CLAWHUB_BIN)) {
    console.error(`clawhub CLI not found at ${CLAWHUB_BIN}; resolving from git tags only.`);
    return new Set();
  }
  const versions = new Set();
  for (const plugin of listPlugins()) {
    for (const version of publishedVersions(plugin.packageName)) versions.add(version);
  }
  return versions;
}

const base = openclawVersion();
const published = publishedReleaseVersions();
const isTaken = (version) => tagExists(`v${version}`) || published.has(version);

if (!isTaken(base)) {
  console.log(base);
  process.exit(0);
}

for (let n = 2; n < 1000; n++) {
  const candidate = `${base}-${n}`;
  if (!isTaken(candidate)) {
    console.log(candidate);
    process.exit(0);
  }
}

console.error(`Could not resolve a free release version for base ${base}.`);
process.exit(1);
