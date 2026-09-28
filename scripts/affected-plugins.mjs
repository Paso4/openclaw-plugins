#!/usr/bin/env bun
/**
 * affected-plugins.mjs --base <ref>
 *
 * Lists the plugins a release affects: the packages named in the changesets
 * that were pending at <base> (the commit just before the release) and consumed
 * by the release. Changesets are the repository's source of truth for change
 * intent, so this is the set publish.yml should ship.
 *
 * If <base> is omitted or cannot be resolved (e.g. the repository's root
 * commit), every plugin is selected.
 *
 * Prints a JSON array of plugin objects (same shape as `list-plugins.mjs`).
 */
import { spawnSync } from 'node:child_process';
import { listPlugins, REPO_ROOT } from './list-plugins.mjs';

function parseArgs(argv) {
  const args = { base: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') args.base = argv[++i] ?? '';
  }
  return args;
}

function git(args) {
  return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf-8' });
}

function refExists(ref) {
  return git(['rev-parse', '--verify', '--quiet', ref]).status === 0;
}

function changesetFiles(base) {
  const result = git(['ls-tree', '-r', '--name-only', base, '.changeset/']);
  if (result.status !== 0) return [];
  return result.stdout
    .split('\n')
    .map((l) => l.trim())
    .filter((f) => f.endsWith('.md') && !/(^|\/)README\.md$/.test(f));
}

function pendingPackages(base) {
  const names = new Set();
  for (const file of changesetFiles(base)) {
    const show = git(['show', `${base}:${file}`]);
    if (show.status !== 0) continue;
    const frontmatter = show.stdout.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) continue;
    for (const line of frontmatter[1].split('\n')) {
      const m = line.match(/^\s*(['"]?)(.+?)\1\s*:\s*(major|minor|patch)\s*$/);
      if (m) names.add(m[2].trim());
    }
  }
  return names;
}

function toMatrix(plugins) {
  return plugins.map(({ type, name, dir, packageName, version }) => ({
    type,
    name,
    dir,
    packageName,
    version,
  }));
}

const { base } = parseArgs(process.argv.slice(2));
const plugins = listPlugins();

if (!base || !refExists(base)) {
  if (base) console.error(`Base ${JSON.stringify(base)} not found; selecting all plugins.`);
  console.log(JSON.stringify(toMatrix(plugins)));
  process.exit(0);
}

const packages = pendingPackages(base);
const affected = plugins.filter((plugin) => packages.has(plugin.packageName));
console.log(JSON.stringify(toMatrix(affected)));
