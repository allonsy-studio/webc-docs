/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { isServerComment, scan } from "../src/scan.js";

describe("scan", () => {
	it("treats any dash-framed comment as server-only", () => {
		expect(isServerComment("- x -")).toBe(true);
		expect(isServerComment("---- x ----")).toBe(true);
		expect(isServerComment(" x ")).toBe(false);
		const s = scan("<!--- a --->\n<!-- b -->\n<!----- c ----->\n<p></p>");
		expect(s.comments).toHaveLength(2);
		expect(s.regularComments).toEqual([2]);
	});

	it("attaches a comment to the next element, skipping whitespace", () => {
		const s = scan("<div><!--- x --->\n\n  <slot name='a'></slot></div><!--- y --->text<slot></slot>");
		expect(s.comments[0]!.next).toEqual({ tag: "slot", slot: "a" });
		expect(s.comments[1]!.next).toBeUndefined();
	});

	it("records expressions with lines and loop scope", () => {
		const s = scan('<ul webc:if="ok">\n<li webc:for="(x, i) of xs" :id="x.id" @text="i" a="b" @lit="no"></li></ul>');
		expect(s.expressions.map((e) => [e.attr, e.value, e.line, e.loops])).toEqual([
			["webc:if", "ok", 1, []],
			["webc:for", "(x, i) of xs", 2, []],
			[":id", "x.id", 2, ["(x, i) of xs"]],
			["@text", "i", 2, ["(x, i) of xs"]],
		]);
	});

	it("implies webc.attributes for a bare @attributes", () => {
		expect(scan("<div @attributes></div>").expressions[0]!.value).toBe("webc.attributes");
	});

	it("skips webc:raw, webc:ignore and transformed templates", () => {
		const s = scan("<div webc:raw><slot></slot><p @text=\"a\"></p></div><div webc:ignore><slot name=\"x\"></slot></div><template webc:type=\"markdown\"><slot name=\"y\"></slot></template>");
		expect(s.slots).toEqual([]);
		expect(s.expressions).toEqual([]);
		expect(s.transforms).toEqual(["markdown"]);
	});

	it("separates script kinds", () => {
		const s = scan("<script webc:setup>const a = 1</script><script webc:type=\"js\">a</script><script webc:type=\"render\">export default () => 1</script><script>1</script>");
		expect(s.setups).toHaveLength(1);
		expect(s.serverBlocks.map((b) => b.kind)).toEqual(["js", "render"]);
		expect(s.clientScripts).toHaveLength(1);
	});

	it("records imports, uses, webc:is and slot fallback", () => {
		const s = scan("<my-card webc:import=\"./c.webc\"></my-card><div webc:is=\"other-one\"></div><slot>  </slot><slot name=\"n\"><b>x</b></slot>");
		expect(s.imports).toEqual([{ path: "./c.webc", line: 1 }]);
		expect(s.uses).toEqual(["my-card", "other-one"]);
		expect(s.slots.map((x) => [x.name, x.hasFallback])).toEqual([["", false], ["n", true]]);
	});

	it("finds slots inside declarative shadow DOM", () => {
		const s = scan("<template shadowrootmode='open'><slot name='z'></slot></template>");
		expect(s.shadowDom).toBe(true);
		expect(s.slots[0]!.name).toBe("z");
	});

	it("never throws on broken input", () => {
		for (const src of ["", "<", "<div", "<!--- x", "<script>", "<template><template>", "\0"]) expect(() => scan(src)).not.toThrow();
	});
});
