#!/usr/bin/env bun
/**
 * changed-plugins.mjs --base <sha> --head <sha>
 *
 * Computes which plugins changed between two revisions, for the CI matrix.
 * Plugins are matched by their `plugins/<type>/<name>/` directory prefix.
 *
 * Any change to shared infrastructure (workflows, scripts, root config,
 * lockfile, changesets) selects **all** plugins, because those files affect
 * every plugin's build/test/publish.
 *
 * Prints a JSON array of plugin objects (same shape as `list-plugins.mjs`).
 * An empty array means no plugin work is needed.
 */
import { spawnSync } from 'node:child_process';
import { listPlugins, REPO_ROOT } from './list-plugins.mjs';

const ALL_ZERO = /^0{40}$/;

const SHARED_PREFIXES = ['.github/', '.changeset/', '.opencode/', 'skills/', 'scripts/'];

const SHARED_FILES = new Set([
  'package.json',
  'bun.lock',
  'bun.lockb',
  'tsconfig.json',
  '.oxlintrc.json',
  '.oxfmtrc.json',
]);

function parseArgs(argv) {
  const args = { base: '', head: 'HEAD' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') args.base = argv[++i] ?? '';
    else if (argv[i] === '--head') args.head = argv[++i] ?? 'HEAD';
  }
  return args;
}

function changedFiles(base, head) {
  const attempts = [
    ['diff', '--name-only', base, head],
    ['diff', '--name-only', `${head}~1`, head],
    ['show', '--pretty=format:', '--name-only', head],
  ];
  for (const cmd of attempts) {
    const result = spawnSync('git', cmd, { cwd: REPO_ROOT, encoding: 'utf-8' });
    if (result.status === 0) {
      return result.stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    }
  }
  return [];
}

const { base, head } = parseArgs(process.argv.slice(2));
const plugins = listPlugins();

const noBase = !base || ALL_ZERO.test(base);
const files = noBase ? [] : changedFiles(base, head);

function toMatrix(plugins) {
  return plugins.map(({ type, name, dir, packageName, version }) => ({
    type,
    name,
    dir,
    packageName,
    version,
  }));
}

if (
  noBase ||
  files.some((f) => SHARED_PREFIXES.some((p) => f.startsWith(p)) || SHARED_FILES.has(f))
) {
  console.log(JSON.stringify(toMatrix(plugins)));
  process.exit(0);
}

const changed = plugins.filter((plugin) => files.some((f) => f.startsWith(`${plugin.dir}/`)));
console.log(JSON.stringify(toMatrix(changed)));
