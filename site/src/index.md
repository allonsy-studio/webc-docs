---
title: webcdoc
layout: norn-landing.webc
anchors: true
description: Documentation metadata for WebC components, from the comments already in the file.
---

## Set up with Eleventy

Add the plugin next to `@11ty/eleventy-plugin-webc`, and point it at the same component globs. Every build writes `webcdoc.json` to the output folder and exposes the same document to templates as `webcdoc`.

```sh
yarn add --dev @allons-y/eleventy-plugin-webcdoc
```

The plugin also reads the filters and helpers your site registers, so a call to one of them is documented as a host helper rather than an unknown name.

## Run the CLI outside Eleventy

For WebC outside Eleventy, the `webcdoc` command reads the files directly and writes the same document, without the host checks.

```sh
yarn add --dev @allons-y/webcdoc
yarn webcdoc "components/**/*.webc" --out webcdoc.json
```

## Document a component

A component documents itself in a server-only comment at the top of its file, or next to the element it describes. The [comment format](/comment-format/) page shows a full example and the record it produces.
