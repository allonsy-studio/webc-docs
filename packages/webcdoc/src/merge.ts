/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord, TagItem, Warning, WebcInfo } from "@allons-y/webcdoc-schema";
import { findJsdoc, parseBlock } from "./blocks.js";
import type { Block, RawTag } from "./blocks.js";
import { hostTag, setupInfo, slotsOf } from "./infer.js";
import { buildReferences } from "./references.js";
import type { ScanResult } from "./scan.js";
import { TAGS, isKnownTag, toAttr, toCss, toDemo, toEvent, toExample, toNamed, toProp } from "./tags.js";

export interface MergeOptions {
	path: string;
	helpers: string[];
}

type Keyed<T> = Map<string, T & { line: number }>;

/** Stated facts, collected by tag. Inline blocks are applied after the header, so they win. */
interface Stated {
	summary?: string;
	tagName?: string;
	deprecated: boolean | string;
	props: Keyed<ReturnType<typeof toProp>>;
	attributes: Keyed<ReturnType<typeof toAttr>>;
	slots: Keyed<ReturnType<typeof toNamed>>;
	cssProperties: Keyed<ReturnType<typeof toCss>>;
	cssParts: Keyed<ReturnType<typeof toNamed>>;
	cssStates: Keyed<ReturnType<typeof toNamed>>;
	events: Keyed<ReturnType<typeof toEvent>>;
	examples: ReturnType<typeof toExample>[];
	demos: ReturnType<typeof toDemo>[];
	tags: Record<string, TagItem[]>;
}

const newStated = (): Stated => ({
	deprecated: false,
	props: new Map(),
	attributes: new Map(),
	slots: new Map(),
	cssProperties: new Map(),
	cssParts: new Map(),
	cssStates: new Map(),
	events: new Map(),
	examples: [],
	demos: [],
	tags: {},
});

/** Later values override earlier ones field by field; empty values never erase. */
function put<T extends object>(map: Keyed<T>, item: T & { name: string }, line: number): void {
	const defined = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined && v !== ""));
	map.set(item.name, { ...map.get(item.name), ...item, ...defined, line } as T & { line: number });
}

function apply(into: Stated, tag: RawTag, slotTarget?: string): void {
	if (!isKnownTag(tag.tag)) {
		(into.tags[tag.tag] ??= []).push({ name: tag.name, description: tag.description });
		return;
	}
	switch (TAGS[tag.tag].shape) {
		case "text":
			into.summary = tag.description.trim();
			break;
		case "name":
			into.tagName = tag.name;
			break;
		case "prop":
			put(into.props, toProp(tag), tag.line);
			break;
		case "attr":
			put(into.attributes, toAttr(tag), tag.line);
			break;
		case "named": {
			const item = toNamed(tag);
			if (tag.tag === "slot") put(into.slots, { ...item, name: slotTarget ?? item.name }, tag.line);
			else put(tag.tag === "csspart" ? into.cssParts : into.cssStates, item, tag.line);
			break;
		}
		case "css":
			put(into.cssProperties, toCss(tag), tag.line);
			break;
		case "event":
			put(into.events, toEvent(tag), tag.line);
			break;
		case "example":
			into.examples.push(toExample(tag.description));
			break;
		case "demo":
			into.demos.push(toDemo(tag));
			break;
		case "flag":
			into.deprecated = tag.description.trim() || true;
			break;
		case "meta":
			(into.tags[tag.tag] ??= []).push({ name: tag.name, description: tag.description });
			break;
	}
}

const fileTag = (path: string): string => path.split(/[\\/]/).pop()!.replace(/\.webc$/, "");
const list = <T>(m: Keyed<T>): Omit<T & { line: number }, "line">[] => [...m.values()].map((v) => {
	const copy: Partial<typeof v> = { ...v };
	delete copy.line;
	return copy as Omit<typeof v, "line">;
});

/** Combines what the comments state with what the template shows. */
export function buildRecord(scan: ScanResult, opts: MergeOptions): ComponentRecord {
	const stated = newStated();
	const warnings: Warning[] = [];
	let description = "";

	// Header comments first, then in-place blocks (slot comments, style and setup JSDoc).
	const inline: { block: Block; slot?: string }[] = [];
	for (const c of scan.comments) {
		const block = parseBlock(c.data, c.line);
		if (c.next?.tag === "slot") inline.push({ block, slot: c.next.slot });
		else {
			description ||= block.description;
			for (const t of block.tags) apply(stated, t);
		}
	}
	for (const s of [...scan.styles, ...scan.setups])
		for (const j of findJsdoc(s.text, s.line)) inline.push({ block: parseBlock(j.raw, j.line) });
	for (const { block, slot } of inline) {
		if (slot !== undefined && block.description && !block.tags.some((t) => t.tag === "slot"))
			put(stated.slots, { name: slot, description: block.description }, block.line);
		for (const t of block.tags) apply(stated, t, t.tag === "slot" ? slot : undefined);
	}

	// Existence comes from the template.
	const slots = slotsOf(scan).map((s) => ({
		name: s.name,
		description: stated.slots.get(s.name)?.description ?? "",
		hasFallback: s.hasFallback,
		source: "template" as const,
	}));
	for (const [name, s] of stated.slots)
		if (!slots.some((t) => t.name === name))
			warnings.push({ code: "slot-missing", message: `Slot "${name}" is documented but the template has no <slot> for it.`, line: s.line });
	for (const s of slotsOf(scan))
		if (s.name === "" && s.hasFallback)
			warnings.push({ code: "default-slot-fallback", message: "Default slot has fallback content, which renders only when the host has no child nodes at all, whitespace included.", line: s.line });

	const props = list(stated.props);
	const setup = setupInfo(scan.setups);
	const references = buildReferences(scan, {
		props: props.map((p) => p.property),
		setup: setup.exports.map((e) => e.name),
		helpers: opts.helpers,
	});
	const seen = new Set<string>();
	for (const r of references.unresolved)
		if (r.in === "template" && !seen.has(r.name!)) {
			seen.add(r.name!);
			warnings.push({ code: "prop-undocumented", message: `"${r.name}" is read in the template but is not a documented prop, setup export, loop variable, or known helper.`, line: r.line });
		}
	if (scan.regularComments.length)
		warnings.push({
			code: "regular-comment",
			message: `${scan.regularComments.length} regular comment${scan.regularComments.length === 1 ? " ships" : "s ship"} to output; use <!--- ---> to keep a comment server-side.`,
			line: scan.regularComments[0]!,
		});

	const scoped = scan.styles.find((s) => "webc:scoped" in s.attrs);
	const styles: WebcInfo["styles"] = { present: scan.styles.length > 0, scope: scoped ? "webc:scoped" : null };
	if (scoped?.attrs["webc:scoped"]) styles.hash = scoped.attrs["webc:scoped"];
	if (scan.styles.some((s) => "webc:keep" in s.attrs)) styles.keep = true;
	if (scan.styles.some((s) => "webc:nobundle" in s.attrs)) styles.nobundle = true;
	const bucket = scan.styles.find((s) => s.attrs["webc:bucket"])?.attrs["webc:bucket"];
	if (bucket) styles.bucket = bucket;

	return {
		path: opts.path,
		tagName: stated.tagName || (opts.path ? fileTag(opts.path) : ""),
		summary: stated.summary ?? "",
		description,
		props,
		attributes: list(stated.attributes),
		slots,
		cssProperties: list(stated.cssProperties),
		cssParts: list(stated.cssParts),
		cssStates: list(stated.cssStates),
		events: list(stated.events),
		examples: stated.examples,
		demos: stated.demos,
		deprecated: stated.deprecated,
		tags: stated.tags,
		webc: {
			host: hostTag(scan),
			setup,
			styles,
			clientScript: scan.clientScripts.length > 0,
			imports: scan.imports.map((i) => i.path),
			uses: [...new Set([...scan.uses])],
			shadowDom: scan.shadowDom,
			transforms: [...new Set(scan.transforms)],
			references,
		},
		warnings,
	};
}
