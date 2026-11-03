# @allons-y/webcdoc

Parses JSDoc-style comments in WebC components into JSON documentation metadata. It reads `.webc` files, combines the comments with what the template shows, and writes one record per component. Parser only: no rendering, no Eleventy, no TypeScript compiler.

Status: pre-release (`0.1.0-beta.0`).

## Install

```sh
npm install --save-dev @allons-y/webcdoc
```

Requires Node 24.

## Comment format

Write documentation in a WebC server-only comment (`<!--- --->`), which never ships to output. A `/** */` block inside `<style>` or `<script webc:setup>` works the same way. Regular `<!-- -->` comments are ignored (and reported, since they ship to output).

```html
<!---
A link to the main content region, placed first in the page.

@summary Skip-to-content link.
@prop {string} [label=Skip to content] - Visible text of the link.
@prop {string} [target=#main] - Id of the region to jump to.
@prop {boolean} [sticky=false] - Keep the link visible once focused.
@cssprop {<color>} [--skip-link-bg=CanvasText] - Background when focused.
@example Default
<skip-link></skip-link>
@example Custom target
<skip-link @target="#content" @label="Jump to article"></skip-link>
@since 0.2.0
--->
<script webc:setup>
  /** Normalize a WebC boolean prop ("", "true", true all mean on). */
  const isOn = (v) => v === true || v === '' || v === 'true';
</script>
<a :href="target" :class="isOn(sticky) ? 'is-sticky' : ''" @text="label"></a>
<!--- @slot icon - Decorative icon shown before the label. --->
<slot name="icon"></slot>
<style webc:scoped>
  /** @csspart link - The anchor element, for consumers styling it from outside. */
  :host a:focus { background: var(--skip-link-bg); }
</style>
```

The tag grammar is `@tag {type} [name=default] - description`. Brackets mean optional. A tag written next to the thing it describes (a comment before a `<slot>`, a block in `<style>` or setup) wins over the header. Slots, the host tag, and references are inferred from the template, and inference decides what exists: a documented slot with no `<slot>` is a warning, not a slot.

## Tags

| Tag           | Record field    | Form                                                  |
| ------------- | --------------- | ----------------------------------------------------- |
| `@summary`    | `summary`       | One line of text.                                     |
| `@tag`        | `tagName`       | Overrides the file name as the tag name.              |
| `@prop`       | `props`         | `{type} [name=default] - description`                 |
| `@attr`       | `attributes`    | `{type} [name=default] - description`                 |
| `@slot`       | `slots`         | `name - description`; no name means the default slot. |
| `@cssprop`    | `cssProperties` | `{syntax} [--name=default] - description`             |
| `@csspart`    | `cssParts`      | `name - description`                                  |
| `@cssstate`   | `cssStates`     | `name - description`                                  |
| `@fires`      | `events`        | `{type} name - description`                           |
| `@example`    | `examples`      | Title on the tag line, code on the lines after it.    |
| `@demo`       | `demos`         | `url - description`                                   |
| `@deprecated` | `deprecated`    | Optional reason; the field is `true` or the reason.   |
| `@since`      | `tags.since`    | Version.                                              |

Other tags are kept under `tags[name]` as `{ name, description }`. Unknown tags are never errors.

## CLI

```sh
webcdoc "components/**/*.webc" --out webcdoc.json
```

| Flag                | Effect                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `--out <file>`      | Where to write the grouped document. Default `webcdoc.json`.            |
| `--split`           | Also write `components/<tag>.json` next to the output file.             |
| `--manifest`        | Also write `custom-elements.json` next to the output file.              |
| `--strict`          | Exit with code 1 when any warning was raised.                           |
| `--helpers a,b`     | Names a host provides. Replaces the default list.                       |

The last line on stdout reads `Documented 12 components, 2 warnings`. Warnings are listed on stderr with file and line.

## API

```ts
import { parse, parseFile, parseAll, toManifest } from "@allons-y/webcdoc";

const record = parse(source, { path: "components/skip-link.webc" });
const file = await parseFile("components/skip-link.webc");
const doc = await parseAll("components/**/*.webc");
const manifest = toManifest(doc.components, doc);
```

Warnings never throw: each record has `warnings: [{ code, message, line }]`, and the document has package-level warnings such as `duplicate-tag`.

## Record shape

One record per file. The types live in [`@allons-y/webcdoc-schema`](../webcdoc-schema) and are re-exported here.

```json
{
  "path": "components/skip-link.webc",
  "tagName": "skip-link",
  "summary": "Skip-to-content link.",
  "description": "A link to the main content region, placed first in the page.",
  "props": [{ "name": "label", "attribute": "@label", "property": "label", "type": { "text": "string" }, "default": "Skip to content", "optional": true, "description": "..." }],
  "attributes": [],
  "slots": [{ "name": "icon", "description": "...", "hasFallback": false, "source": "template" }],
  "cssProperties": [], "cssParts": [], "cssStates": [], "events": [],
  "examples": [], "demos": [], "deprecated": false, "tags": {},
  "webc": { "host": {}, "setup": {}, "styles": {}, "clientScript": false, "imports": [], "uses": [], "references": {} },
  "warnings": []
}
```

The default slot has the name `""`. `webc.host` says whether WebC keeps the host tag in the output and why.

## References

`webc.references` sorts every name read in template expressions and setup scripts into buckets: `props` (documented props), `setup` (exports of `webc:setup`), `loops` (variables from `webc:for`), `data` (`$data.*` paths), `helpers` (names from the helper list), `webc` (`webc.*` accessors), and `unresolved` (everything else). Each entry has the name or path, the line, and whether it was read in the template or in setup.

The report exists for portability. A component that reads global data, calls helpers, or uses names nothing defines only works in hosts that provide them. `data`, `helpers`, and `unresolved` list what a host must supply before the component renders the same way elsewhere. Unresolved names read in the template also raise `prop-undocumented`.

## Custom Elements Manifest

`toManifest(records, pkg)` returns a [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (`schemaVersion` `2.1.0`), typed against the official `custom-elements-manifest` schema. Each record becomes one module with one custom element declaration and a `custom-element-definition` export. Props and attributes become `attributes`; slots, CSS properties, parts, states, events, and demos map directly. WebC-only facts sit under a `webc` key on the declaration. The module also exports small predicates (`isCustomElementDeclaration`, `isCustomElementExport`), `getCustomElements`, and `normalizeModulePath`.

## License

[MPL-2.0](../../LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
