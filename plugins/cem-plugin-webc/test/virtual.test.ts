/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { extractClientScripts, virtualSource } from "../src/index.js";

describe("extractClientScripts", () => {
	it("keeps client scripts and skips setup, server, external, data, ignored and raw ones", () => {
		const src = [
			"<script webc:setup>const a = 1;</script>",
			'<script webc:type="js">1 + 1</script>',
			'<script webc:type="render">export default () => "";</script>',
			'<script src="./x.js"></script>',
			'<script type="application/ld+json">{}</script>',
			"<script webc:ignore>nope()</script>",
			"<template webc:raw><script>raw()</script></template>",
			'<script type="module">kept()</script>',
		].join("\n");
		expect(extractClientScripts(src)).toEqual([{ text: "kept()", line: 8 }]);
	});

	it("finds scripts inside nested elements and declarative shadow DOM", () => {
		const src = '<div>\n<template shadowrootmode="open">\n<script>inShadow()</script></template></div>';
		expect(extractClientScripts(src)).toEqual([{ text: "inShadow()", line: 3 }]);
	});
});

describe("virtualSource", () => {
	it("is empty without a client script", () => {
		expect(virtualSource("<p>Hi</p>\n<script webc:setup>x</script>")).toBe("");
	});

	it("pads with newlines so each body starts on its .webc line", () => {
		const src = "<p></p>\n\n<script>\nfirst();\n</script>\n<p></p>\n<script>second();</script>";
		const lines = virtualSource(src).split("\n");
		expect(lines[3]).toBe("first();");
		expect(lines[6]).toBe("second();");
	});
});
