---
'@paso4/cloudflare-unified-billing': patch
---

Republish the 2026.10.6 plugin release as `2026.10.6-2`.

The first 2026.10.6 publication was blocked on ClawHub by an upstream ClawScan
failure (`skillspector` crashed with a serialization error while scanning the
plugin), which left version 2026.10.6 staged by a failed publish attempt.
ClawHub reserves that version number and only the original CI publish
authorization can recover the attempt, so the release ships under the
documented `-N` build suffix instead (`2026.10.6-2`; the base still tracks
OpenClaw 2026.10.6).

No plugin source, manifest, or test changes: the artifact is the 2026.10.6
migration retried with fresh security checks.
