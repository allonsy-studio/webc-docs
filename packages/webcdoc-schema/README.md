# @allons-y/webcdoc-schema

TypeScript types and a JSON Schema for the document that [`@allons-y/webcdoc`](../webcdoc) writes.

## Install

```sh
npm install @allons-y/webcdoc-schema
```

## Use

```ts
import { SCHEMA_VERSION } from "@allons-y/webcdoc-schema";
import type { ComponentRecord, WebcdocDocument, Warning } from "@allons-y/webcdoc-schema";
```

The JSON Schema (draft 2020-12) is exported as `@allons-y/webcdoc-schema/schema.json`. Its `$id` is `https://allons-y.studio/schemas/webcdoc/1.0.0.json`.

`SCHEMA_VERSION` equals this package's version and is written to `schemaVersion` in every document.

## Warning codes

The `code` values are stable and listed in the schema's enum, so tools can key on them.

| Code                    | Meaning                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `slot-missing`          | A documented slot has no `<slot>` in the template.              |
| `default-slot-fallback` | The default slot has fallback content.                           |
| `prop-undocumented`     | A name is read in the template but resolves to nothing.          |
| `regular-comment`       | `<!-- -->` comments ship to output.                              |
| `duplicate-tag`         | Two files give the same tag name (package level, with `paths`).  |
| `host-no-display`       | Reserved.                                                        |

## License

[MPL-2.0](../../LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
