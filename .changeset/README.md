# Changesets

This folder is managed by [Changesets](https://changesets.dev/). It records the
change intent for every plugin so releases can assemble changelogs and version
packages deterministically.

## Adding a changeset

Any change to a plugin under `plugins/<type>/<name>/` must include a changeset:

```bash
bun run changeset
```

Pick the affected plugin(s), the bump type, and write a short summary. Commit the
generated `.changeset/<name>.md` file with your change.

## How versions are applied

Changesets is the front door for change intent, but the repository ships a
**single global version** whose base always matches the compatible OpenClaw
version declared in the root `package.json` → `catalog.openclaw`.

On release, `bun run version` runs `changeset version` (consuming changesets into
the plugin `CHANGELOG.md` files), then `bun scripts/sync-versions.mjs` stamps the
global CalVer onto:

- every plugin `package.json` → `version`
- every plugin `package.json` → `openclaw.minOpenclawVersion`
- every plugin `openclaw.plugin.json` → `version`
- the newest heading in every plugin `CHANGELOG.md`

`bun run verify:versions` (run in CI) fails if any of those drift from the global
version. See the root [README](../README.md) for the full versioning policy.
