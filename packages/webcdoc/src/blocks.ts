/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { parse, tokenizers } from "comment-parser";
import type { Spec } from "comment-parser";

/** One `@tag` line group as comment-parser reports it. */
export interface RawTag {
	tag: string;
	name: string;
	type: string;
	optional: boolean;
	default?: string;
	description: string;
	/** 1-based line in the .webc file. */
	line: number;
}

/** A documentation block, whatever carried it. */
export interface Block {
	description: string;
	tags: RawTag[];
	line: number;
}

/** Tags whose first word is part of the text, not a name. */
const NO_NAME = new Set(["summary", "example", "deprecated"]);
const nameTokenizer = tokenizers.name();

/** Name tokenizer that skips free-text tags and treats a bare `-` as no name. */
const name = (spec: Spec): Spec => {
	if (NO_NAME.has(spec.tag)) return spec;
	const next = nameTokenizer(spec);
	if (next.name === "-") next.name = "";
	return next;
};

const TOKENIZERS = [tokenizers.tag(), tokenizers.type(), name, tokenizers.description("preserve")];

/** Removes the indentation shared by every non-blank line. */
function dedent(text: string): string {
	const lines = text.split("\n");
	const indents = lines.filter((l) => l.trim()).map((l) => /^\s*/.exec(l)![0].length);
	const cut = indents.length ? Math.min(...indents) : 0;
	return lines.map((l) => l.slice(cut)).join("\n");
}

/** Wraps a `<!--- --->` body as a JSDoc block so line numbers stay true. */
function frame(raw: string, line: number): { source: string; startLine: number } {
	const body = dedent(raw.replace(/^-+/, "").replace(/-+$/, "").replaceAll("*/", "* /"));
	return body.startsWith("\n")
		? { source: `/**${body}\n*/`, startLine: line }
		: { source: `/**\n${body}\n*/`, startLine: line - 1 };
}

/**
 * Parses one comment body: the raw data of a WebC server-only comment, or a
 * `/** *\/` JSDoc block. Both carriers give the same output.
 */
export function parseBlock(raw: string, line = 1): Block {
	const { source, startLine } = raw.startsWith("/**") ? { source: raw, startLine: line } : frame(raw, line);
	const [block] = parse(source, { spacing: "preserve", tokenizers: TOKENIZERS, startLine });
	if (!block) return { description: "", tags: [], line };
	return {
		description: block.description.trim(),
		line,
		tags: block.tags.map((t) => ({
			tag: t.tag,
			name: t.name,
			type: t.type,
			optional: t.optional,
			default: t.default,
			description: t.description.replace(/^\s*-\s+/, "").replace(/\s+$/, ""),
			line: t.source[0]?.number ?? line,
		})),
	};
}

/** Finds every `/** *\/` block in a text, with the 1-based line it starts on. */
export function findJsdoc(text: string, firstLine = 1): { raw: string; line: number; index: number; end: number }[] {
	return [...text.matchAll(/\/\*\*[\s\S]*?\*\//g)].map((m) => ({
		raw: m[0],
		index: m.index,
		end: m.index + m[0].length,
		line: firstLine + text.slice(0, m.index).split("\n").length - 1,
	}));
}
