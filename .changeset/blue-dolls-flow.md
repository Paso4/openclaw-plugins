---
---

Pin Node **24.22.1** in the live-test lane (`actions/setup-node`).

OpenClaw 2026.10.7 rejects Node below `>=24.22.1 <25 || >=26.12.1` in its
preinstall engine gate. The workflow asked for `node-version: 24`, which resolves
to whatever 24.x the runner's tool cache offers (24.21.0 at the time of writing),
so `npm install -g openclaw@2026.10.7` failed the post-merge `develop` run
([40356814695](https://github.com/Paso4/openclaw-plugins/actions/runs/40356814695)).
Pin the exact floor, matching the main `fouria` workflow.

CI-only change; nothing to release.
