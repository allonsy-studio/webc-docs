/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

/** A client script body and the line its text starts on. */
export interface ClientScript {
	text: string;
	line: number;
}

const SCRIPT_TYPES = new Set(["", "module", "text/javascript", "application/javascript"]);
const isElement = (n: Node): n is Element => "tagName" in n;
const attr = (el: Element, name: string): string | undefined => el.attrs.find((a) => a.name === name)?.value;
const has = (el: Element, name: string): boolean => el.attrs.some((a) => a.name === name);

/** Client scripts: not `webc:setup`, not a server block, not external, not data blocks. */
const isClientScript = (el: Element): boolean =>
	el.tagName === "script" &&
	!has(el, "webc:setup") &&
	!["js", "render"].includes(attr(el, "webc:type") ?? "") &&
	!has(el, "src") &&
	SCRIPT_TYPES.has((attr(el, "type") ?? "").toLowerCase());

/** Reads the client `<script>` bodies of a .webc source, in document order. */
export function extractClientScripts(source: string): ClientScript[] {
	const found: ClientScript[] = [];
	const visit = (nodes: Node[]): void => {
		for (const node of nodes) {
			if (!isElement(node)) continue;
			if (has(node, "webc:ignore") || has(node, "webc:raw")) continue;
			if (node.tagName === "template") {
				if (!has(node, "webc:type")) visit((node as DefaultTreeAdapterMap["template"]).content.childNodes);
				continue;
			}
			if (isClientScript(node)) {
				const text = node.childNodes.find((n) => n.nodeName === "#text") as DefaultTreeAdapterMap["textNode"] | undefined;
				if (text?.value.trim()) found.push({ text: text.value, line: text.sourceCodeLocation?.startLine ?? 1 });
			} else visit(node.childNodes);
		}
	};
	visit(parse(source, { sourceCodeLocationInfo: true }).childNodes);
	return found;
}

/**
 * Builds the text of the virtual module: each script body sits on the line it
 * starts on in the .webc file, so TypeScript positions are .webc line numbers.
 */
export function virtualSource(source: string): string {
	let out = "";
	let line = 1;
	for (const script of extractClientScripts(source)) {
		out += "\n".repeat(Math.max(script.line - line, out ? 1 : 0)) + script.text;
		line = Math.max(script.line, line) + (script.text.match(/\n/g)?.length ?? 0);
	}
	return out;
}
