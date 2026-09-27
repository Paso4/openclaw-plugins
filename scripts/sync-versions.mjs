#!/usr/bin/env bun
/**
 * sync-versions.mjs [version]
 *
 * Applies the repository's global version to every place a version is declared:
 *
 *   - root `package.json` → `version`
 *   - every plugin `package.json` → `version`
 *   - every plugin `package.json` → `openclaw.minOpenclawVersion` (the OpenClaw
 *     compatibility base, i.e. the global version without a `-N` build suffix)
 *   - every plugin `openclaw.plugin.json` → `version`
 *   - the newest `## <version>` heading of every plugin `CHANGELOG.md`
 *
 * With no argument it uses the root `package.json` version. This is what makes
 * the plugin package files "follow" the global version; it runs after
 * `changeset version` in the release flow (see `.github/workflows/release.yml`).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { listPlugins, REPO_ROOT } from './list-plugins.mjs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, json) {
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

function rewriteChangelogHeading(path, version) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  const idx = lines.findIndex((line) => /^##\s+/.test(line));
  if (idx === -1) return;
  const next = `## ${version}`;
  if (lines[idx].trim() === next) return;
  lines[idx] = next;
  writeFileSync(path, lines.join('\n'));
}

const rootPkgPath = join(REPO_ROOT, 'package.json');
const argVersion = process.argv[2];
const version = (argVersion ?? readJson(rootPkgPath).version).trim();

if (!/^\d{4}\.\d+\.\d+(?:-\d+)?$/.test(version)) {
  console.error(
    `Invalid global version ${JSON.stringify(version)}. Expected CalVer "<YYYY>.<M>.<D>[-N>]".`,
  );
  process.exit(1);
}

const base = version.split('-')[0];
const plugins = listPlugins();

const rootPkg = readJson(rootPkgPath);
rootPkg.version = version;
writeJson(rootPkgPath, rootPkg);
console.log(`root package.json -> ${version}`);

for (const plugin of plugins) {
  const pkgPath = join(REPO_ROOT, plugin.dir, 'package.json');
  const pkg = readJson(pkgPath);
  pkg.version = version;
  if (pkg.openclaw && typeof pkg.openclaw === 'object') {
    pkg.openclaw.minOpenclawVersion = base;
  }
  writeJson(pkgPath, pkg);

  const manifestPath = join(REPO_ROOT, plugin.dir, 'openclaw.plugin.json');
  if (existsSync(manifestPath)) {
    const manifest = readJson(manifestPath);
    manifest.version = version;
    writeJson(manifestPath, manifest);
  }

  rewriteChangelogHeading(join(REPO_ROOT, plugin.dir, 'CHANGELOG.md'), version);

  console.log(`${plugin.dir} -> ${version} (minOpenclawVersion ${base})`);
}

console.log(`\nApplied global version ${version} to ${plugins.length} plugin(s).`);
