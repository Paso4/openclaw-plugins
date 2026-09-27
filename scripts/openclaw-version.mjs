#!/usr/bin/env bun
/**
 * openclaw-version.mjs
 *
 * Prints the compatible OpenClaw version declared once in the root
 * `package.json` → `catalog.openclaw` (range operators stripped).
 *
 * This is the single source of truth for the OpenClaw compatibility target:
 * workflows and plugins derive from it, and the repo's global version's base
 * must equal it (enforced by `verify-versions.mjs`).
 */
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const raw = pkg.catalog?.openclaw;

if (typeof raw !== 'string' || raw.length === 0) {
  console.error('package.json is missing "catalog.openclaw"');
  process.exit(1);
}

console.log(raw.replace(/^[\^~>=<\s]+/, '').trim());
