---
title: Plugins
layout: norn-docs.webc
description: The Eleventy plugin, the linter, the tools, and the Custom Elements Manifest plugin.
---

## Eleventy plugin

`@allons-y/eleventy-plugin-webcdoc` generates the document inside an Eleventy build, where the site's filters, helpers, and global data are known. It exposes the document as the `webcdoc` global data and writes `webcdoc.json` to the output folder. Set `components` to the same globs the WebC plugin uses, or leave it out to read them from the WebC plugin.

## Lint

`@allons-y/webcdoc-lint` validates a document against the JSON Schema and reports findings for each component. Rules cover data and helpers a component should not read, unresolved names, regular comments, missing summaries, and undocumented props. The `webcdoc-lint` command exits with status 1 on any error-level finding.

## Tools

`@allons-y/webcdoc-tools` holds pure helpers for a document: predicates, lookups by tag name or path, the graph of which components use which, and the host data and helpers the components need. It has no I/O, so it runs the same in a build, a test, or a script.

## Custom Elements Manifest

`@allons-y/cem-plugin-webc` lets a project that already runs the Custom Elements Manifest analyzer read `.webc` files in the same run. Add `webcModuleCreation()` as `overrideModuleCreation` and `webcPlugin()` to `plugins`, and each component lands in `custom-elements.json` with its slots, CSS properties, parts, and attributes.
