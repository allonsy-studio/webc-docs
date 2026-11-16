---
"@allons-y/webcdoc-schema": patch
"@allons-y/webcdoc": patch
"@allons-y/eleventy-plugin-webcdoc": patch
"@allons-y/cem-plugin-webc": patch
---

Reads the package version from `package.json` instead of a hardcoded constant, so `SCHEMA_VERSION`, `VERSION`, and the `generator` field no longer lag behind a release.
