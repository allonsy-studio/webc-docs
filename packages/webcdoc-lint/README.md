# @allons-y/webcdoc-lint

Validates a webcdoc document against its JSON Schema, then lints the components in it for problems a documentation build should catch. It reads the JSON that `@allons-y/webcdoc` writes and has no I/O beyond the CLI.

Status: pre-release (`0.1.0-beta.0`).

## Install

```sh
npm install --save-dev @allons-y/webcdoc-lint
```

## Usage

```sh
webcdoc-lint webcdoc.json
webcdoc-lint webcdoc.json --config lint.json --format json
```

```js
import { readFile } from "node:fs/promises";
import { lint, validate } from "@allons-y/webcdoc-lint";

const doc = JSON.parse(await readFile("webcdoc.json", "utf8"));

validate(doc);                                   // { valid, errors: [{ path, message }] }
lint(doc, { rules: { "no-global-data": "off" } }); // { findings: [{ rule, severity, tagName, path, line, message }] }
```

`validate` checks the document against `@allons-y/webcdoc-schema`'s JSON Schema and reports each error with a JSON Pointer such as `/components/0/tagName`. `lint` runs the rules below. Run `validate` first: `lint` assumes the document has the shape the schema describes.

## Rules

Every rule has a default severity. `warn` is printed and exits 0. `error` is printed and exits 1.

| Rule | Default | Flags |
| --- | --- | --- |
| `no-global-data` | `warn` | Reads of page data under `$data`, which the host must supply. |
| `no-undeclared-helper` | `warn` | Calls to helper functions, which the host must register. |
| `no-unresolved` | `warn` | Identifiers that resolve to no prop, setup export, loop variable, or helper. |
| `no-regular-comments` | `warn` | Regular `<!-- -->` comments, which ship to the built output. |
| `require-summary` | `warn` | A component with no `@summary`. |
| `require-prop-docs` | `warn` | Identifiers read in the template that no documented prop explains. |
| `no-default-slot-fallback` | `warn` | A default slot with fallback content, which renders only when the host has no child nodes. |
| `no-missing-data` | `warn` | `$data` paths the Eleventy plugin could not find. Reports the `data-missing` warning code. |
| `no-missing-import` | `warn` | `webc:import` paths the Eleventy plugin could not resolve. Reports the `import-missing` warning code. |
| `no-duplicate-tag` | `error` | A tag name that two or more files define. |
| `no-deprecated-use` | `warn` | A component that uses another component marked deprecated. |

## Configuration

Settings map a rule name to `"off"`, `"warn"`, or `"error"`. Rules you leave out keep their default.

```json
{
  "rules": {
    "no-global-data": "off",
    "require-summary": "error"
  }
}
```

Without `--config`, the CLI reads `webcdoc-lint.config.json` from the current directory, then the `webcdocLint` key of `package.json` in that directory. An unknown rule name or setting stops the run with exit code 2.

## CLI

```text
webcdoc-lint <webcdoc.json> [--config file] [--format pretty|json]
```

Pretty output prints one line per problem as `path:line rule message`, then a summary such as `Linted 12 components, 0 errors, 2 warnings`. A schema error prints as `/json/pointer schema message` and skips the lint rules. `--format json` prints `{ valid, errors, findings, summary }`.

| Exit code | Meaning |
| --- | --- |
| `0` | The document is valid and has no `error` findings. |
| `1` | The document fails the schema, or a rule reports at `error` severity. |
| `2` | Bad arguments, an unreadable file, or an invalid config. |

## Requirements

- Node 24 or later.
- `@allons-y/webcdoc-schema` and `@allons-y/webcdoc-tools` are installed with this package.

## License

[MPL-2.0](../../LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
