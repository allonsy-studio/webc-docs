# webcdoc

webcdoc is a parser that turns JSDoc-style comments in `.webc` files into JSON documentation metadata. It reads one component at a time, records its props, slots, CSS custom properties, and parts, and writes the result as a document you can publish or feed to other tools.

## Layout

- [`packages/webcdoc`](packages/webcdoc): `@allons-y/webcdoc`, the parser, the `webcdoc` CLI, and a Custom Elements Manifest adapter.
- [`plugins/cem-plugin-webc`](plugins/cem-plugin-webc): `@allons-y/cem-plugin-webc`, a Custom Elements Manifest analyzer plugin for WebC components.
- [`site`](site): the Eleventy documentation site, private and not published to npm.

## License

[MPL-2.0](LICENSE): use freely, modify as needed; changes to MPL-licensed files should be shared back under the same license.

---

<sub> Built and maintained by [Allons-y Studio](https://allons-y.studio) — a North Carolina-based studio specializing in design systems, front-end architecture, and accessibility. Available to work on your next big project. </sub>
