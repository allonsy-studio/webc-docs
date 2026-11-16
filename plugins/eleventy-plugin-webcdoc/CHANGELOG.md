# @allons-y/eleventy-plugin-webcdoc

## 0.1.0

### Minor Changes

-   Adds an Eleventy plugin that generates the webcdoc document inside the build, with the site's helpers and global data in view, and writes `webcdoc.json` plus a `webcdoc` global data entry. (📝 [#5](https://github.com/allonsy-studio/webc-docs/pull/5)) — thanks [@castastrophe](https://github.com/castastrophe)!

### Patch Changes

-   Reads the package version from `package.json` instead of a hardcoded constant, so `SCHEMA_VERSION`, `VERSION`, and the `generator` field no longer lag behind a release. (📝 [#20](https://github.com/allonsy-studio/webc-docs/pull/20)) — thanks [@castastrophe](https://github.com/castastrophe)!
-   Updated `@allons-y/webcdoc` 0.1.0-beta.0 → 0.1.0 ([diff](https://github.com/allonsy-studio/webc-docs/compare/@allons-y/webcdoc@0.1.0-beta.0...@allons-y/webcdoc@0.1.0))
