#!/usr/bin/env bun
/**
 * list-plugins.mjs
 *
 * Discovers every plugin in the monorepo. A plugin is any directory of the
 * shape `plugins/<type>/<name>/` that contains a `package.json`, where `<type>`
 * is one of the OpenClaw plugin shapes:
 *
 *   channel | provider | cli-backend | tool | feature
 *
 * Usage:
 *   bun scripts/list-plugins.mjs [--filter <name>] [--json|--human]
 *
 * With no `--json`/`--human` flag it prints a JSON array (used by CI matrices).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN_TYPES = ['channel', 'provider', 'cli-backend', 'tool', 'feature'];

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @returns {{ type: string, name: string, dir: string, packageName: string, version: string, scripts: Record<string, string> }[]}
 */
export function listPlugins() {
  const plugins = [];
  for (const type of PLUGIN_TYPES) {
    const typeDir = join(REPO_ROOT, 'plugins', type);
    if (!existsSync(typeDir)) continue;
    for (const name of readdirSync(typeDir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const dir = `plugins/${type}/${name.name}`;
      const pkgPath = join(REPO_ROOT, dir, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      plugins.push({
        type,
        name: name.name,
        dir,
        packageName: pkg.name,
        version: pkg.version,
        scripts: pkg.scripts ?? {},
      });
    }
  }
  return plugins.sort((a, b) => a.dir.localeCompare(b.dir));
}

function parseArgs(argv) {
  const args = { filter: '', human: false, matrix: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--filter') args.filter = argv[++i] ?? '';
    else if (arg === '--human') args.human = true;
    else if (arg === '--matrix') args.matrix = true;
  }
  return args;
}

if (import.meta.main) {
  const { filter, human, matrix } = parseArgs(process.argv.slice(2));
  let plugins = listPlugins();
  if (filter) {
    plugins = plugins.filter((p) => p.name === filter || p.packageName === filter);
    if (plugins.length === 0) {
      console.error(`No plugin matched --filter ${JSON.stringify(filter)}`);
      process.exit(1);
    }
  }
  if (human) {
    for (const p of plugins) {
      console.log(`${p.packageName}@${p.version}  (${p.type})  ${p.dir}`);
    }
  } else if (matrix) {
    console.log(
      JSON.stringify(
        plugins.map(({ type, name, dir, packageName, version }) => ({
          type,
          name,
          dir,
          packageName,
          version,
        })),
      ),
    );
  } else {
    console.log(JSON.stringify(plugins));
  }
}
