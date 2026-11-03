# @allons-y/cem-plugin-webc

Custom Elements Manifest analyzer plugin that reads `.webc` files, so a project already running the analyzer gets WebC components in the same `custom-elements.json`.

Status: pre-release (`0.1.0-beta.0`). The plugin is not implemented yet.

## Install

```sh
yarn add --dev @allons-y/cem-plugin-webc @custom-elements-manifest/analyzer
```

## Usage

```js
// custom-elements-manifest.config.mjs
import { webcModuleCreation, webcPlugin } from "@allons-y/cem-plugin-webc";

export default {
	globs: ["src/**/*.js", "components/**/*.webc"],
	overrideModuleCreation: webcModuleCreation(),
	plugins: [webcPlugin()],
};
```

## Requirements

- Node.js ≥ 24
- `@custom-elements-manifest/analyzer` 0.10.x (peer dependency)

## License

[MPL-2.0](../../LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
