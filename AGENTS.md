# AGENTS.md

Agent instructions for `@allons-y/webc-docs`. Studio-wide conventions (voice, style,
licensing, attribution) live in the org's
[AGENTS.md](https://github.com/allonsy-studio/.github/blob/main/AGENTS.md); this file
covers this repository only.

## Stack

- Yarn 4 (`nodeLinker: node-modules`), Node 24 (see `.nvmrc`), ESM only
- TypeScript 5 with `tsc` emitting `dist/` and declarations
- Vitest for tests
- opx (`@allons-y/opx-cli`, `opx-lint-js`, `opx-lint-json`, `opx-lint-md`) for lint and format
- `@allons-y/opx-release` (`opx release`, which wraps Changesets) for versions and publishing

## Commands

| Command                 | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `yarn install`          | Install dependencies (run `corepack enable` first)           |
| `yarn lint`             | Lint JS, TS, JSON, and Markdown via `opx lint`               |
| `yarn format`           | Apply lint fixes via `opx lint --fix`                        |
| `yarn build`            | Build every workspace in dependency order                    |
| `yarn typecheck`        | Type-check `src` and `test` in every workspace (build first) |
| `yarn test`             | Run Vitest in every workspace                                |
| `yarn changeset`        | Record a change for the next release                         |
| `yarn run version`      | Bump versions, write changelogs, refresh the lockfile        |
| `yarn release`          | Build, then publish packages not yet on the registry         |

Run one workspace's tests from the repository root with
`yarn vitest run --project <name>`, for example
`yarn vitest run --project @allons-y/webcdoc`. Add `-u` to update snapshots.
`yarn workspace <name> run test` does not work, because `vitest` is declared only at the
root. Likewise `yarn version` is Yarn's own command, so the version script runs as
`yarn run version`.

## Layout

- `packages/webcdoc`: `@allons-y/webcdoc`, the parser, CLI, and manifest adapter
- `packages/webcdoc-schema`: `@allons-y/webcdoc-schema`, the record types and JSON Schema
- `packages/webcdoc-tools`: `@allons-y/webcdoc-tools`, pure helpers for filtering, looking up, and ordering components
- `packages/webcdoc-lint`: `@allons-y/webcdoc-lint`, the documentation linter and its rules
- `plugins/eleventy-plugin-webcdoc`: `@allons-y/eleventy-plugin-webcdoc`, the Eleventy plugin that generates the document inside the build
- `plugins/cem-plugin-webc`: `@allons-y/cem-plugin-webc`, the Custom Elements Manifest plugin
- `site`: Eleventy docs site, private, not published to npm
- `.license-header.js`: header text enforced on `src`, `test`, and `bin` files

## Testing

Layout, naming, and techniques follow the org's
[testing standard](https://github.com/allonsy-studio/.github/blob/main/docs/testing.md).

- Tests live in `test/` inside each package and run with Vitest.
- Root `vitest.config.ts` lists the workspace projects.
- Fixtures go in `packages/webcdoc/test/fixtures/`; shared helpers in `test/helpers.ts`.
- `WEBC_STUBS_DIR` (see `.env.example`) points the stubs test at WebC's own test files.

## Source conventions

- Every file under `src/`, `test/`, and `bin/` starts with the MPL-2.0 block comment
  from `.license-header.js`.
- Code comments are short JSDoc. Explanations belong in commit bodies and docs.
- Use US spelling in code, docs, and file names.

## Commits & attribution

- Conventional Commits with lowercase, imperative subjects and no trailing period.
- Commit author and committer: `Cassondra Roberts <1840295+castastrophe@users.noreply.github.com>`.
- No AI attribution in commits, PRs, or comments: no `Co-Authored-By` trailers, no
  "Generated with" footers, no session links.
- PR bodies use the org's pull request template sections: What, Why, How, Test plan, Checklist.
