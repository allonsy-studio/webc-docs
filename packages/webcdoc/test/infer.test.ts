/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { extractDataPaths, extractIdentifiers, extractWebc, hostTag, parseLoop, setupInfo } from "../src/infer.js";
import { scan } from "../src/scan.js";

describe("extractIdentifiers", () => {
	it("skips strings, property access, keywords and globals", () => {
		expect(extractIdentifiers("a.b + 'c d' + Math.max(e, 1) ? typeof f : true")).toEqual(["a", "e", "f"]);
	});
	it("reads inside template literals and skips arrow parameters", () => {
		expect(extractIdentifiers("`x ${name} ${list.map(i => i.id + offset)}`")).toEqual(["name", "list", "offset"]);
	});
	it("handles optional chaining, spread and object keys", () => {
		expect(extractIdentifiers("{ key: val, ...rest, o?.p }")).toEqual(["val", "rest", "o"]);
	});
	it("leaves $data and webc to their own extractors", () => {
		expect(extractIdentifiers("$data.site.title + webc.attributes")).toEqual([]);
		expect(extractDataPaths("$data.site.title + $data[\"a\"].b")).toEqual(["site.title", "a.b"]);
		expect(extractWebc("webc.filePath || webc.attributes")).toEqual(["webc.filePath", "webc.attributes"]);
	});
});

describe("parseLoop", () => {
	it.each([
		["x of arr", ["x"], "arr"],
		["(x, i) of arr", ["x", "i"], "arr"],
		["k in obj", ["k"], "obj"],
		["(k, v, i) in obj", ["k", "v", "i"], "obj"],
		["  (k,v)   in   a.b  ", ["k", "v"], "a.b"],
	])("%s", (expr, vars, source) => {
		expect(parseLoop(expr)).toEqual({ vars, source });
	});
});

describe("hostTag", () => {
	const host = (src: string) => hostTag(scan(src));
	it("drops the host for plain markup", () => {
		expect(host("<p>hi</p>")).toEqual({ rendered: false, reason: "none" });
	});
	it.each([
		["<style>a{}</style><p></p>", "style"],
		["<p></p><script>1</script>", "script"],
		['<link rel="stylesheet" href="a.css"><p></p>', "stylesheet"],
		["<p webc:root></p>", "root"],
		["<template shadowrootmode='open'><slot></slot></template>", "shadow-dom"],
		['<script src="a.js"></script>', "script"],
	])("keeps the host for %s", (src, reason) => {
		expect(host(src)).toEqual({ rendered: true, reason });
	});
	it("ignores empty and setup blocks and nested styles", () => {
		expect(host("<style> </style><script webc:setup>const a = 1</script>").rendered).toBe(false);
		expect(host("<div><style>a{}</style></div>").rendered).toBe(false);
		expect(host('<script webc:type="js">1</script>').rendered).toBe(false);
	});
	it("drops the host for webc:root=override", () => {
		expect(host('<style>a{}</style><p webc:root="override"></p>')).toEqual({ rendered: false, reason: "root-override" });
	});
});

describe("setupInfo", () => {
	it("finds top-level exports and imports, skipping nested ones", () => {
		const s = scan(`<script webc:setup>
import { a } from './a.js';
import b from "b";
/** Adds. */
function add(x) { const inner = 1; return x + inner; }
const n = 1, m = () => {};
let fn = async (q) => q;
class K {}
</script>`);
		const info = setupInfo(s.setups);
		expect(info.imports).toEqual(["./a.js", "b"]);
		expect(info.exports).toEqual([
			{ name: "add", kind: "function", description: "Adds." },
			{ name: "n", kind: "variable", description: "" },
			{ name: "fn", kind: "function", description: "" },
			{ name: "K", kind: "class", description: "" },
		]);
	});
});
