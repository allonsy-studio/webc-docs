# @allons-y/cem-plugin-webc

Custom Elements Manifest analyzer plugin that reads `.webc` files, so a project already running the analyzer gets WebC components in the same `custom-elements.json`.

Status: pre-release (`0.1.0-beta.0`).

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

Run `custom-elements-manifest analyze` as usual. Each `.webc` file becomes a module in `custom-elements.json` with one custom element declaration, and JS and TS files are analyzed exactly as before.

## Options

Both functions take the same optional settings.

| Option    | Default                                  | Description                                                                          |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `cwd`     | `process.cwd()`                          | Directory the analyzer's globs are relative to. Pass the same value to both functions. |
| `helpers` | the `@allons-y/webcdoc` default list     | `webcPlugin` only. Names a host provides, so calls to them are not reported as unresolved. |

## How it works

The analyzer reads JavaScript, so `webcModuleCreation` gives it one virtual source file per `.webc` file. The file holds the client `<script>` body, padded with blank lines so positions match the `.webc` line numbers. A file with no client script becomes an empty module.

`webcPlugin` then parses the same file with `@allons-y/webcdoc` and merges the result into that module:

- A class the analyzer found, linked through `customElements.define` (including a `define` inside a block or an `if` guard), keeps everything it documents.
- `summary`, `description`, `attributes`, `slots`, `cssProperties`, `cssParts`, `cssStates`, and `events` come from the `.webc` documentation only where the class has none.
- When no `define` call exists, or the file has no script, the tag name comes from the file name (or `@tag`) and the plugin adds the declaration and its `custom-element-definition` export.
- WebC facts such as the rendered host tag, setup exports, references, examples, and tags go under a `webc` key on the declaration.

Parser warnings print to the analyzer's dev log (`--dev`) as `[WEBC] path:line code message`.

## Requirements

- Node.js ≥ 24
- `@custom-elements-manifest/analyzer` 0.10.x (peer dependency)

## License

[MPL-2.0](../../LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
