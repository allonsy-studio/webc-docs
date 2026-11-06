# Changesets

Releases are managed with [`opx release`](https://www.npmjs.com/package/@allons-y/opx-release), which wraps [changesets](https://github.com/changesets/changesets). For any change a consumer would notice, run `yarn changeset`, pick the bump, write the summary for a human reader, and commit the generated file with the code. Docs, tests, CI, and internal refactors need no changeset.
