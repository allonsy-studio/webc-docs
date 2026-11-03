/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];
type Template = DefaultTreeAdapterMap["template"];

export interface ScanComment {
	data: string;
	line: number;
	/** The next element sibling (whitespace skipped), if any. */
	next?: { tag: string; slot?: string };
}
export interface ScanScript {
	text: string;
	line: number;
	attrs: Record<string, string>;
	topLevel: boolean;
}
export interface ScanSlot {
	/** `""` for the default slot. */
	name: string;
	hasFallback: boolean;
	line: number;
}
export interface ScanExpr {
	/** Attribute the expression was read from. */
	attr: string;
	value: string;
	line: number;
	/** Enclosing `webc:for` expressions, outermost first. */
	loops: string[];
}
export interface ScanResult {
	/** Server-only (`<!--- --->`) comments. */
	comments: ScanComment[];
	/** Line of each comment that ships to output. */
	regularComments: number[];
	setups: ScanScript[];
	clientScripts: ScanScript[];
	/** `webc:type="js"` and `webc:type="render"` blocks. */
	serverBlocks: { kind: string; line: number }[];
	styles: ScanScript[];
	stylesheets: { href: string; line: number; topLevel: boolean }[];
	slots: ScanSlot[];
	imports: { path: string; line: number }[];
	/** Targets of `webc:is`. */
	is: { value: string; line: number }[];
	/** Custom tags used, in order of first use. */
	uses: string[];
	root?: "merge" | "override";
	shadowDom: boolean;
	/** Values of `webc:type` on templates and styles. */
	transforms: string[];
	expressions: ScanExpr[];
}

const EXPRESSION_ATTRS = new Set(["@html", "@raw", "@text", "@attributes", "webc:if", "webc:elseif", "webc:for"]);
const FRAME = new Set(["html", "head", "body"]);

const isElement = (n: Node): n is Element => "tagName" in n;
const isTemplate = (n: Element): n is Template => n.tagName === "template";
const isBlank = (s: string): boolean => !s.trim();

/** Server-only comments have data that starts and ends with a dash, as in WebC's `ast.js`. */
export const isServerComment = (data: string): boolean => data.startsWith("-") && data.endsWith("-");

/** Parsing as a document puts nodes in head and body; this restores one ordered list. */
function topLevel(nodes: Node[]): Node[] {
	return nodes.flatMap((n) => (isElement(n) && FRAME.has(n.tagName) ? topLevel(n.childNodes) : [n]));
}

/**
 * Walks a .webc source once and collects every fact the other modules need.
 * Never throws: parse5 recovers from any input.
 */
export function scan(source: string): ScanResult {
	const out: ScanResult = {
		comments: [],
		regularComments: [],
		setups: [],
		clientScripts: [],
		serverBlocks: [],
		styles: [],
		stylesheets: [],
		slots: [],
		imports: [],
		is: [],
		uses: [],
		shadowDom: false,
		transforms: [],
		expressions: [],
	};
	const doc = parse(source, { sourceCodeLocationInfo: true });

	const lineOf = (n: Node): number => n.sourceCodeLocation?.startLine ?? 1;

	function visitList(nodes: Node[], top: boolean, loops: string[]): void {
		let pending: ScanComment[] = [];
		for (const node of nodes) {
			if (node.nodeName === "#comment") {
				const data = (node as DefaultTreeAdapterMap["commentNode"]).data;
				if (isServerComment(data)) {
					const c = { data, line: lineOf(node) };
					out.comments.push(c);
					pending.push(c);
				} else out.regularComments.push(lineOf(node));
			} else if (node.nodeName === "#text") {
				if (!isBlank((node as DefaultTreeAdapterMap["textNode"]).value)) pending = [];
			} else if (isElement(node)) {
				const slot = node.tagName === "slot" ? (node.attrs.find((a) => a.name === "name")?.value ?? "") : undefined;
				for (const c of pending) c.next = { tag: node.tagName, slot };
				pending = [];
				visitElement(node, top, loops);
			}
		}
	}

	function visitElement(el: Element, top: boolean, outer: string[]): void {
		const attrs: Record<string, string> = {};
		for (const a of el.attrs) attrs[a.name] ??= a.value;
		const line = lineOf(el);
		const attrLine = (name: string): number => el.sourceCodeLocation?.attrs?.[name]?.startLine ?? line;
		const tag = el.tagName;
		if ("webc:ignore" in attrs) return;
		if ("webc:root" in attrs && top) out.root = attrs["webc:root"] === "override" ? "override" : "merge";

		const textNode = el.childNodes.find((n) => n.nodeName === "#text") as DefaultTreeAdapterMap["textNode"] | undefined;
		const script: ScanScript = {
			text: textNode?.value ?? "",
			line: textNode ? lineOf(textNode) : line,
			attrs,
			topLevel: top,
		};
		const wtype = attrs["webc:type"];

		if (tag === "script") {
			if ("webc:setup" in attrs) out.setups.push(script);
			else if (wtype === "js" || wtype === "render") out.serverBlocks.push({ kind: wtype, line });
			else out.clientScripts.push(script);
			if (wtype === "js" && !("webc:setup" in attrs)) out.expressions.push({ attr: "webc:type", value: script.text, line: script.line, loops: outer });
			return;
		}
		if (tag === "style") {
			out.styles.push(script);
			if (wtype) out.transforms.push(wtype);
			return;
		}
		if (tag === "link" && attrs.rel?.toLowerCase().split(/\s+/).includes("stylesheet")) {
			out.stylesheets.push({ href: attrs.href ?? "", line, topLevel: top });
		}

		if ("webc:import" in attrs) out.imports.push({ path: attrs["webc:import"]!, line: attrLine("webc:import") });
		if (attrs["webc:is"]) {
			out.is.push({ value: attrs["webc:is"], line: attrLine("webc:is") });
			if (attrs["webc:is"].includes("-") && !out.uses.includes(attrs["webc:is"])) out.uses.push(attrs["webc:is"]);
		}
		if (tag.includes("-") && !out.uses.includes(tag)) out.uses.push(tag);

		const raw = "webc:raw" in attrs;
		if (isTemplate(el)) {
			if (attrs.shadowrootmode !== undefined || attrs.shadowroot !== undefined) out.shadowDom = true;
			if (wtype) out.transforms.push(wtype);
		}
		if (raw || (wtype && tag === "template")) return;

		// Expressions: `webc:for` is read in the outer scope, the rest inside it.
		let loops = outer;
		for (const name of ["webc:for", ...Object.keys(attrs)]) {
			if (name === "webc:for" && !(name in attrs)) continue;
			if (name === "webc:for" && loops !== outer) continue;
			const value = attrs[name]!;
			const isExpr = name.startsWith(":") || EXPRESSION_ATTRS.has(name);
			if (!isExpr) continue;
			const expr = name === "@attributes" && !value ? "webc.attributes" : value;
			out.expressions.push({ attr: name, value: expr, line: attrLine(name), loops });
			if (name === "webc:for") loops = [...outer, value];
		}

		if (tag === "slot") {
			out.slots.push({
				name: attrs.name ?? "",
				line,
				hasFallback: el.childNodes.some(
					(n) => isElement(n) || (n.nodeName === "#text" && !isBlank((n as DefaultTreeAdapterMap["textNode"]).value)),
				),
			});
		}
		visitList(isTemplate(el) ? el.content.childNodes : el.childNodes, false, loops);
	}

	visitList(topLevel(doc.childNodes), true, []);
	return out;
}
