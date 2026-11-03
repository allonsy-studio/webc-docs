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

## Commands

| Command        | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `yarn install` | Install dependencies (run `corepack enable` first)  |
| `yarn lint`    | Lint JS, TS, JSON, and Markdown via `opx lint`       |
| `yarn format`  | Apply lint fixes via `opx lint --fix`                |
| `yarn build`   | Build every workspace in dependency order            |
| `yarn test`    | Run Vitest in every workspace                        |

Run a single workspace with `yarn workspace <name> run <script>`, for example
`yarn workspace @allons-y/webcdoc run test`.

## Layout

- `packages/webcdoc`: `@allons-y/webcdoc`, the parser, CLI, and manifest adapter
- `plugins/eleventy-plugin-webcdoc`: `@allons-y/eleventy-plugin-webcdoc`, the Eleventy plugin that generates the document inside the build
- `plugins/cem-plugin-webc`: `@allons-y/cem-plugin-webc`, the Custom Elements Manifest plugin
- `site`: Eleventy docs site, private, not published to npm
- `.license-header.js`: header text enforced on `src`, `test`, and `bin` files

## Testing

- Tests live in `test/` inside each package and run with Vitest.
- Root `vitest.config.ts` lists the workspace projects.
- Fixtures go in `packages/webcdoc/test/fixtures/`.

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
