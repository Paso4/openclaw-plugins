#!/usr/bin/env bun
/**
 * verify-versions.mjs
 *
 * Enforces the repository's single global version policy:
 *
 *   1. The global version (root `package.json` `version`) is CalVer and its
 *      base matches the compatible OpenClaw version in `catalog.openclaw`.
 *   2. Every plugin `package.json` `version` equals the global version.
 *   3. Every plugin `openclaw.plugin.json` `version` equals the global version.
 *   4. Every plugin `openclaw.minOpenclawVersion` equals the OpenClaw base.
 *
 * Runs in CI (`bun run verify:versions`) and before releases. Exits non-zero on
 * any mismatch so plugin package files can never drift from the global version.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listPlugins, REPO_ROOT } from './list-plugins.mjs';

const errors = [];

const rootPkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8'));
const globalVersion = String(rootPkg.version ?? '').trim();
const openclawRaw = rootPkg.catalog?.openclaw;
const openclawVersion =
  typeof openclawRaw === 'string' ? openclawRaw.replace(/^[\^~>=<\s]+/, '').trim() : '';

if (!/^\d{4}\.\d+\.\d+(?:-\d+)?$/.test(globalVersion)) {
  errors.push(
    `root package.json version ${JSON.stringify(globalVersion)} is not CalVer "<YYYY>.<M>.<D>[-N>]".`,
  );
}

const globalBase = globalVersion.split('-')[0];
if (!openclawVersion) {
  errors.push('root package.json is missing "catalog.openclaw".');
} else if (globalBase !== openclawVersion) {
  errors.push(
    `global version base ${JSON.stringify(globalBase)} must match compatible OpenClaw ${JSON.stringify(openclawVersion)} ` +
      '(root package.json -> catalog.openclaw).',
  );
}

const plugins = listPlugins();
if (plugins.length === 0) {
  errors.push('No plugins discovered under plugins/<type>/<name>/.');
}

for (const plugin of plugins) {
  const pkgPath = join(REPO_ROOT, plugin.dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  if (pkg.version !== globalVersion) {
    errors.push(
      `${plugin.dir}/package.json version ${JSON.stringify(pkg.version)} != global ${JSON.stringify(globalVersion)}`,
    );
  }

  const minOpenclaw = pkg.openclaw?.minOpenclawVersion;
  if (minOpenclaw !== undefined && minOpenclaw !== openclawVersion) {
    errors.push(
      `${plugin.dir}/package.json openclaw.minOpenclawVersion ${JSON.stringify(minOpenclaw)} != ${JSON.stringify(openclawVersion)}`,
    );
  }

  // ClawHub requires external code plugins to declare these OpenClaw fields.
  const compat = pkg.openclaw?.compat;
  if (compat?.pluginApi !== `>=${openclawVersion}`) {
    errors.push(
      `${plugin.dir}/package.json openclaw.compat.pluginApi ${JSON.stringify(compat?.pluginApi)} != ">=${openclawVersion}"`,
    );
  }
  if (compat?.minGatewayVersion !== openclawVersion) {
    errors.push(
      `${plugin.dir}/package.json openclaw.compat.minGatewayVersion ${JSON.stringify(compat?.minGatewayVersion)} != ${JSON.stringify(openclawVersion)}`,
    );
  }
  const build = pkg.openclaw?.build;
  if (build?.openclawVersion !== openclawVersion) {
    errors.push(
      `${plugin.dir}/package.json openclaw.build.openclawVersion ${JSON.stringify(build?.openclawVersion)} != ${JSON.stringify(openclawVersion)}`,
    );
  }
  if (build?.pluginSdkVersion !== openclawVersion) {
    errors.push(
      `${plugin.dir}/package.json openclaw.build.pluginSdkVersion ${JSON.stringify(build?.pluginSdkVersion)} != ${JSON.stringify(openclawVersion)}`,
    );
  }
  if (pkg.openclaw?.install?.minHostVersion !== `>=${openclawVersion}`) {
    errors.push(
      `${plugin.dir}/package.json openclaw.install.minHostVersion ${JSON.stringify(pkg.openclaw?.install?.minHostVersion)} != ">=${openclawVersion}"`,
    );
  }

  const manifestPath = join(REPO_ROOT, plugin.dir, 'openclaw.plugin.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    if (manifest.version !== globalVersion) {
      errors.push(
        `${plugin.dir}/openclaw.plugin.json version ${JSON.stringify(manifest.version)} != global ${JSON.stringify(globalVersion)}`,
      );
    }
  } else {
    errors.push(`${plugin.dir} is missing openclaw.plugin.json`);
  }
}

if (errors.length > 0) {
  console.error('Version policy violations:\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error(
    '\nRun `bun run sync:versions` to align plugin package files with the global version.',
  );
  process.exit(1);
}

console.log(
  `Version policy OK: global ${globalVersion} (OpenClaw ${openclawVersion}) across ${plugins.length} plugin(s).`,
);
