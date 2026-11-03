---
title: webcdoc
layout: norn-landing.webc
anchors: true
description: Documentation metadata for WebC components, from the comments already in the file.
---

## Set up with Eleventy

Add the plugin next to `@11ty/eleventy-plugin-webc`. It reads the same component globs, so the documented components are the ones your pages use. Every build writes `webcdoc.json` to the output folder and exposes the document to templates as `webcdoc`.

```sh
yarn add --dev @allons-y/eleventy-plugin-webcdoc
```

The plugin checks the filters and helpers your site registers, the global data your templates read, and the `webc:import` paths on disk. A missing value shows up as a warning in the document instead of a surprise in the output.

## Run the CLI outside Eleventy

For WebC outside Eleventy, the `webcdoc` command reads the files directly and writes the same document, without the host checks.

```sh
yarn add --dev @allons-y/webcdoc
yarn webcdoc "components/**/*.webc" --out webcdoc.json
```

Add `--split` to write one file per component, `--manifest` to also write a Custom Elements Manifest, and `--strict` to exit with status 1 on any warning.

## Write the comment

Put the documentation in a WebC server-only comment at the top of the file, or next to the element it describes. Tags follow the JSDoc pattern: `@tag {type} [name=default] - description`, where brackets mark an optional value.

```html
<!---
A link to the main content region, placed first in the page.

@summary Skip-to-content link.
@prop {string} [label=Skip to content] - Visible text of the link.
@prop {string} [target=#main] - Id of the region to jump to.
@cssprop {<color>} [--skip-link-bg=CanvasText] - Background when focused.
@example Default
<skip-link></skip-link>
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

A tag written next to the thing it describes takes precedence over the same tag in the header. Unknown tags never cause an error. Regular `<!-- -->` comments are ignored by webcdoc and still ship to the page, so use the triple-dash form for documentation.
