/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { HostInfo, SetupExport } from "@allons-y/webcdoc-schema";
import { findJsdoc, parseBlock } from "./blocks.js";
import type { ScanResult, ScanScript, ScanSlot } from "./scan.js";

export interface LoopInfo {
	vars: string[];
	source: string;
}
export interface Identifier {
	name: string;
	index: number;
}

const KEYWORDS = new Set(
	"await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null of return static super switch this throw true try typeof var void while with yield async undefined NaN Infinity".split(/\s+/),
);
const GLOBALS = new Set(
	"Math JSON Object Array String Number Boolean Date RegExp Map Set Symbol Promise Error parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent encodeURI decodeURI console globalThis process Intl URL".split(/\s+/),
);

const blank = (s: string): string => s.replace(/[^\n]/g, " ");

/**
 * Blanks comments and string contents. Length is kept unless `interpolate` is
 * set, which keeps the code inside template-literal `${}` parts instead.
 */
export function mask(src: string, interpolate = false): string {
	let out = "";
	let i = 0;
	while (i < src.length) {
		const c = src[i]!;
		const d = src[i + 1];
		if (c === "/" && (d === "/" || d === "*")) {
			let j = d === "/" ? src.indexOf("\n", i) : src.indexOf("*/", i + 2) + 2;
			if (j < (d === "/" ? 0 : 2)) j = src.length;
			out += blank(src.slice(i, j));
			i = j;
		} else if (c === '"' || c === "'" || c === "`") {
			let j = i + 1;
			let inner = "";
			while (j < src.length && src[j] !== c) {
				if (src[j] === "\\") j++;
				else if (interpolate && c === "`" && src[j] === "$" && src[j + 1] === "{") {
					let depth = 1;
					let k = j + 2;
					for (; k < src.length && depth; k++) depth += src[k] === "{" ? 1 : src[k] === "}" ? -1 : 0;
					inner += ` ${mask(src.slice(j + 2, k - 1), true)} `;
					j = k - 1;
				} else if (!interpolate) inner += src[j] === "\n" ? "\n" : " ";
				j++;
			}
			out += c + (interpolate ? inner : inner.padEnd(Math.max(0, j - i - 1), " ")) + (src[j] ?? "");
			i = j + 1;
		} else {
			out += c;
			i++;
		}
	}
	return out;
}

/** Identifiers read in masked code: not property accesses, keywords, globals, or object keys. */
export function identifiersOf(code: string): Identifier[] {
	const skip = new Set<string>();
	for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) for (const p of m[1]!.matchAll(/[A-Za-z_$][\w$]*/g)) skip.add(p[0]);
	for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) skip.add(m[1]!);
	const found: Identifier[] = [];
	for (const m of code.matchAll(/[A-Za-z_$][\w$]*/g)) {
		const name = m[0];
		const before = code.slice(0, m.index).trimEnd();
		const dotted = before.endsWith(".") && !before.endsWith("...");
		const key = /[{,]$/.test(before) && /^\s*:(?!:)/.test(code.slice(m.index + name.length));
		const numeric = /\d$/.test(code[m.index - 1] ?? "");
		if (dotted || key || numeric || skip.has(name) || KEYWORDS.has(name) || GLOBALS.has(name)) continue;
		found.push({ name, index: m.index });
	}
	return found;
}

/** Unique identifiers an expression reads, excluding `$data` and `webc`. */
export function extractIdentifiers(expression: string): string[] {
	const names = identifiersOf(mask(expression, true))
		.map((i) => i.name)
		.filter((n) => n !== "$data" && n !== "webc");
	return [...new Set(names)];
}

/** `$data.site.title` and `$data["site"].title` become `site.title`. */
export function extractDataPaths(expression: string): string[] {
	const paths = [...expression.matchAll(/\$data((?:\.[\w$]+|\[\s*(?:'[^']*'|"[^"]*")\s*\])*)/g)].map((m) =>
		m[1]!.replace(/\[\s*['"]([^'"]*)['"]\s*\]/g, ".$1").replace(/^\./, ""),
	);
	return [...new Set(paths)];
}

/** `webc.attributes` style accessors. */
export function extractWebc(expression: string): string[] {
	return [...new Set([...mask(expression, true).matchAll(/\bwebc\.[\w$]+/g)].map((m) => m[0]))];
}

/** Parses `x of y`, `(k, v) in y`, `(k, v, i) in y`; parentheses optional. */
export function parseLoop(expression: string): LoopInfo {
	const m = /^\s*([\s\S]+?)\s+(?:of|in)\s+([\s\S]+?)\s*$/.exec(expression);
	if (!m) return { vars: [], source: expression.trim() };
	const vars = m[1]!
		.replace(/^\(|\)$/g, "")
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);
	return { vars, source: m[2]! };
}

/**
 * WebC keeps the host tag only when the file has styles, a client script, a
 * stylesheet link, `webc:root`, or declarative shadow DOM at its top level.
 */
export function hostTag(scan: ScanResult): HostInfo {
	if (scan.root === "override") return { rendered: false, reason: "root-override" };
	if (scan.root) return { rendered: true, reason: "root" };
	const live = (s: ScanScript): boolean => s.topLevel && (!!s.text.trim() || !!s.attrs.src);
	if (scan.styles.some(live)) return { rendered: true, reason: "style" };
	if (scan.clientScripts.some(live)) return { rendered: true, reason: "script" };
	if (scan.stylesheets.some((l) => l.topLevel && l.href)) return { rendered: true, reason: "stylesheet" };
	if (scan.shadowDom) return { rendered: true, reason: "shadow-dom" };
	return { rendered: false, reason: "none" };
}

/** Slots by name, merging repeats; fallback on any repeat counts. */
export function slotsOf(scan: ScanResult): ScanSlot[] {
	const byName = new Map<string, ScanSlot>();
	for (const s of scan.slots) {
		const prev = byName.get(s.name);
		byName.set(s.name, prev ? { ...prev, hasFallback: prev.hasFallback || s.hasFallback } : s);
	}
	return [...byName.values()];
}

/** Top-level declarations and imports of the `webc:setup` scripts. */
export function setupInfo(setups: ScanScript[]): { exports: SetupExport[]; imports: string[] } {
	const info: { exports: SetupExport[]; imports: string[] } = { exports: [], imports: [] };
	for (const { text } of setups) {
		const code = mask(text);
		const depth: number[] = [];
		let d = 0;
		for (const ch of code) {
			depth.push(d);
			d += ch === "{" || ch === "(" || ch === "[" ? 1 : ch === "}" || ch === ")" || ch === "]" ? -1 : 0;
		}
		for (const m of code.matchAll(/^[ \t]*import\b(?!\s*\()[\s\S]*?(["'])\s*\1/gm)) {
			const path = /["']([^"']+)["']/.exec(text.slice(m.index, m.index + m[0].length))?.[1];
			if (path) info.imports.push(path);
		}
		const decl = /^[ \t]*(?:export\s+(?:default\s+)?)?(async\s+function\b\s*\*?|function\b\s*\*?|const\b|let\b|var\b|class\b)\s*([A-Za-z_$][\w$]*)/gm;
		const docs = findJsdoc(text);
		for (const m of code.matchAll(decl)) {
			if (depth[m.index] !== 0) continue;
			const word = m[1]!.replace(/[\s*]/g, "");
			const rest = code.slice(m.index + m[0].length);
			const callable = word.endsWith("function") || /^\s*=\s*(?:async\s*)?(?:\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>|function\b)/.test(rest);
			const above = docs.find((b) => /^\s*$/.test(text.slice(b.end, m.index)) || /^\s*$/.test(text.slice(b.end, m.index + m[0].indexOf(m[1]!))));
			info.exports.push({
				name: m[2]!,
				kind: word === "class" ? "class" : callable ? "function" : "variable",
				description: above ? parseBlock(above.raw).description : "",
			});
		}
	}
	return info;
}
