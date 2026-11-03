/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { Reference, References } from "@allons-y/webcdoc-schema";
import { extractDataPaths, extractIdentifiers, extractWebc, identifiersOf, mask, parseLoop } from "./infer.js";
import type { ScanResult } from "./scan.js";

/** Names a host is expected to provide as global data or filters. */
export const DEFAULT_HELPERS = ["url", "slugify", "log", "getCollectionItem", "renderTemplate"];

export interface ReferenceContext {
	/** Documented prop names, in `property` spelling. */
	props: string[];
	/** Names exported by `webc:setup`. */
	setup: string[];
	helpers: string[];
}

export const emptyReferences = (): References => ({
	props: [],
	setup: [],
	loops: [],
	data: [],
	helpers: [],
	unresolved: [],
	webc: [],
});

function add(list: Reference[], ref: Reference): void {
	const same = (r: Reference): boolean => r.name === ref.name && r.path === ref.path && r.line === ref.line && r.in === ref.in;
	if (!list.some(same)) list.push(ref);
}

/** Sorts every identifier read in expressions and setup scripts into buckets. */
export function buildReferences(scan: ScanResult, ctx: ReferenceContext): References {
	const refs = emptyReferences();

	for (const e of scan.expressions) {
		const scoped = new Set(e.loops.flatMap((l) => parseLoop(l).vars));
		const source = e.attr === "webc:for" ? parseLoop(e.value).source : e.value;
		for (const path of extractDataPaths(source)) add(refs.data, { path, line: e.line, in: "template" });
		for (const name of extractWebc(source)) add(refs.webc, { name, line: e.line, in: "template" });
		for (const name of extractIdentifiers(source)) {
			const ref: Reference = { name, line: e.line, in: "template" };
			if (scoped.has(name)) add(refs.loops, ref);
			else if (ctx.props.includes(name)) add(refs.props, ref);
			else if (ctx.setup.includes(name)) add(refs.setup, ref);
			else if (ctx.helpers.includes(name)) add(refs.helpers, ref);
			else add(refs.unresolved, ref);
		}
	}

	for (const s of scan.setups) {
		const code = mask(s.text);
		const declared = new Set<string>();
		for (const m of code.matchAll(/\b(?:const|let|var|function\*?|class)\s+([\w$]+)/g)) declared.add(m[1]!);
		for (const m of code.matchAll(/\b(?:const|let|var)\s*[{[]([^=]*?)[}\]]\s*=/g)) for (const p of m[1]!.matchAll(/[\w$]+/g)) declared.add(p[0]);
		for (const m of code.matchAll(/(?:\bfunction\b[^(]*|\bcatch\s*)\(([^()]*)\)|\(([^()]*)\)\s*=>/g)) for (const p of (m[1] ?? m[2] ?? "").matchAll(/[A-Za-z_$][\w$]*/g)) declared.add(p[0]);
		for (const m of code.matchAll(/^[ \t]*import\b([\s\S]*?)(?=["'])/gm)) for (const p of m[1]!.matchAll(/[A-Za-z_$][\w$]*/g)) declared.add(p[0]);
		const lineAt = (i: number): number => s.line + code.slice(0, i).split("\n").length - 1;
		for (const { name, index } of identifiersOf(code)) {
			if (declared.has(name) || name === "webc" || name === "$data" || name === "from" || name === "as") continue;
			const ref: Reference = { name, line: lineAt(index), in: "setup" };
			add(ctx.helpers.includes(name) ? refs.helpers : refs.unresolved, ref);
		}
		for (const path of extractDataPaths(s.text)) add(refs.data, { path, line: s.line, in: "setup" });
		for (const name of extractWebc(s.text)) add(refs.webc, { name, line: s.line, in: "setup" });
	}
	return refs;
}
