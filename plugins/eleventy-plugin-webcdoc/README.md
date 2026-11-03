# @allons-y/eleventy-plugin-webcdoc

Generates the webcdoc document from inside Eleventy, the recommended way to document WebC components in an Eleventy project. The plugin sees what the standalone CLI cannot: the filters and functions your site registers, the global data your templates read, and the `webc:import` paths that exist on disk.

Status: pre-release (`0.1.0-beta.0`).

## Install

```sh
yarn add --dev @allons-y/eleventy-plugin-webcdoc
```

## Usage

Add the plugin next to `@11ty/eleventy-plugin-webc`. When `components` is left out, the plugin reads the value you gave the WebC plugin, or that plugin's default glob (`_components/**/*.webc`).

```js
// eleventy.config.js
import webcPlugin from "@11ty/eleventy-plugin-webc";
import webcdocPlugin from "@allons-y/eleventy-plugin-webcdoc";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(webcPlugin, { components: "src/_components/**/*.webc" });
	eleventyConfig.addPlugin(webcdocPlugin);
}
```

Each build writes `webcdoc.json` to the output directory and exposes the same document to templates as `webcdoc` global data:

```liquid
{% for component in webcdoc.components %}
  <h2>{{ component.tagName }}</h2>
  <p>{{ component.summary }}</p>
{% endfor %}
```

The plugin finds the WebC plugin by inspecting the plugins registered on `eleventyConfig`. If that lookup ever misses, pass `components` to both plugins with `sharedWebcOptions`:

```js
import { sharedWebcOptions } from "@allons-y/eleventy-plugin-webcdoc";

const shared = sharedWebcOptions("src/_components/**/*.webc");
eleventyConfig.addPlugin(webcPlugin, shared);
eleventyConfig.addPlugin(webcdocPlugin, shared);
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `components` | the `components` of `eleventy-plugin-webc` | Globs and `npm:` aliases, in the shape the WebC plugin takes. `npm:` resolves under `node_modules`. A bare directory means every `.webc` file inside it. |
| `helpers` | `[]` | Extra helper names to treat as provided by the host. |
| `output` | `"webcdoc.json"` | File written into the output directory, or `false` to write nothing. |
| `globalData` | `"webcdoc"` | Global data key that holds the document. |
| `renderExamples` | `false` | Compile each `@example` through `@11ty/webc` and store the result on `examples[].html`. |
| `warnOnMissingData` | `true` | Warn on `$data` paths the global data does not contain. |

## What the host adds

- **Helpers.** The names of the filters and JavaScript functions registered on `eleventyConfig` when the build starts, merged with the `helpers` option. A call to one of them lands in `references.helpers` instead of `references.unresolved`.
- **Data check.** Every `$data.<path>` is checked against the global data: the `_data` directory and values from `addGlobalData`. A path that is not there adds a `data-missing` warning. `page`, `eleventy`, `collections`, and `pkg` are always present. Data that only exists in a template's front matter or a directory data file is not visible to the check; turn it off with `warnOnMissingData: false` when that produces noise.
- **Import check.** Each `webc:import` is resolved against the file system and the `npm:` alias. A path that does not resolve adds an `import-missing` warning.
- **Examples.** With `renderExamples`, the plugin compiles each `@example` with your components, helpers, and global data. An example that fails to compile keeps no `html` and logs the reason.

The `generator` field reads `@allons-y/eleventy-plugin-webcdoc@<version>`. Run [`@allons-y/webcdoc-lint`](../../packages/webcdoc-lint) on the output to turn the warnings into `no-missing-data` and `no-missing-import` findings.

## Without Eleventy

For WebC outside Eleventy, use the `webcdoc` command from [`@allons-y/webcdoc`](../../packages/webcdoc). It produces the same document without the host checks.

## Requirements

- Node.js ≥ 24
- `@11ty/eleventy` 3.x (peer dependency)
- `@11ty/webc` 0.11.x (optional peer dependency, needed for `renderExamples`)

## License

[MPL-2.0](../../LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
