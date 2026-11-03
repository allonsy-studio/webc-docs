# @allons-y/webcdoc-tools

Pure helpers for reading, filtering, and ordering the components in a webcdoc document. They take the JSON that `@allons-y/webcdoc` writes and return answers, with no I/O.

Status: pre-release (`0.1.0-beta.0`).

## Install

```sh
npm install --save-dev @allons-y/webcdoc-tools
```

## Usage

```js
import { readFile } from "node:fs/promises";
import {
  componentsUsing,
  dependenciesOf,
  getComponent,
  hostRequirements,
  isPortable,
  topologicalOrder,
} from "@allons-y/webcdoc-tools";

const doc = JSON.parse(await readFile("webcdoc.json", "utf8"));

getComponent(doc, "app-nav");              // the record for <app-nav>, or undefined
dependenciesOf(doc, "app-shell", { transitive: true });
topologicalOrder(doc);                     // used components first; throws on a cycle
hostRequirements(doc);                     // every data path and helper, with its users
componentsUsing(doc, "site.title");        // tag names that read that data
doc.components.filter(isPortable);         // components that need nothing from the host
```

### Predicates

Each takes one component record.

| Function | True when |
| --- | --- |
| `isDocumented(record)` | It has a summary or description, or a prop or slot with text. |
| `hasClientScript(record)` | It ships a client script that may define a custom element. |
| `rendersHostTag(record)` | WebC keeps the host tag in the output. |
| `isPortable(record)` | It reads no page data, helpers, or unresolved names. |
| `hasWarning(record, code)` | It raised a warning with that code. |
| `isDeprecated(record)` | It is marked deprecated, with or without a reason. |

### Lookups

- `getComponent(doc, tagName)` returns the first record with that tag name.
- `getComponentByPath(doc, path)` matches a record path, ignoring a leading `./` and repeated slashes.
- `listTagNames(doc)` returns each tag name once, in document order.
- `normalizePath(path)` uses forward slashes, drops a leading `./`, and collapses repeated slashes.

### Use graph

`resolveUses(doc)` returns a `Map` from tag name to `{ uses, usedBy, unresolved }`. `uses` comes from the template's custom tags and from `webc:import` paths. An import path resolves to the record whose path ends with it at a segment boundary. Anything that matches no record in the document, such as a tag from another package, lands in `unresolved`.

- `topologicalOrder(doc)` returns tag names with every dependency before its users. A cycle throws an error that names it, such as `Component cycle: a -> b -> a`.
- `dependenciesOf(doc, tagName, { transitive })` lists what a component uses. With `transitive: true`, it follows every chain and never lists the component itself.

### Host requirements

- `hostRequirements(doc)` returns `{ kind: "data" | "helper", name, tagNames }` for each data path and helper any component reads. Data entries come first, each sorted by name.
- `componentsUsing(doc, name)` returns the tag names that read a data path or helper. A data name also matches longer paths under it, so `site` finds `site.title`.

## Requirements

- Node 24 or later.
- `@allons-y/webcdoc-schema` provides the types. It is installed with this package.

## License

[MPL-2.0](../../LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
