/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type {
	AttrItem,
	CssPropItem,
	DemoItem,
	EventItem,
	ExampleItem,
	NamedItem,
	PropItem,
	TagName,
	TypeInfo,
} from "@allons-y/webcdoc-schema";
import type { RawTag } from "./blocks.js";

/** How a tag's text becomes an item. */
export type Shape = "text" | "name" | "prop" | "attr" | "named" | "css" | "event" | "example" | "demo" | "flag" | "meta";

export interface TagSpec {
	/** Record field the item lands in. */
	field: string;
	shape: Shape;
}

export const TAGS: Record<TagName, TagSpec> = {
	summary: { field: "summary", shape: "text" },
	tag: { field: "tagName", shape: "name" },
	prop: { field: "props", shape: "prop" },
	attr: { field: "attributes", shape: "attr" },
	slot: { field: "slots", shape: "named" },
	cssprop: { field: "cssProperties", shape: "css" },
	csspart: { field: "cssParts", shape: "named" },
	cssstate: { field: "cssStates", shape: "named" },
	fires: { field: "events", shape: "event" },
	example: { field: "examples", shape: "example" },
	demo: { field: "demos", shape: "demo" },
	deprecated: { field: "deprecated", shape: "flag" },
	since: { field: "tags", shape: "meta" },
};

export const isKnownTag = (tag: string): tag is TagName => Object.hasOwn(TAGS, tag);

/** `icon-only` becomes `iconOnly`. */
export const camelCase = (s: string): string => s.replace(/-+([a-z0-9])/gi, (_, c: string) => c.toUpperCase());

/** Drops the `@`, `:@` and `:` markers WebC puts on prop and attribute names. */
export const bareName = (s: string): string => s.replace(/^:?@?:?/, "");

const type = (t: string): TypeInfo | undefined => (t ? { text: t } : undefined);

/** Splits an `@example` body into its title line and the code under it. */
export function toExample(text: string): ExampleItem {
	const lines = text.replace(/^\s*\n/, "\n").split("\n");
	const first = lines[0]?.trim() ?? "";
	const codeFirst = first.startsWith("<");
	const body = (codeFirst ? lines : lines.slice(1)).join("\n");
	return { title: codeFirst ? "" : first, code: body.replace(/^\s*\n/, "").trimEnd() };
}

export const toNamed = (t: RawTag): NamedItem => ({ name: t.name, description: t.description });

export const toProp = (t: RawTag): PropItem => {
	const name = bareName(t.name);
	return {
		name,
		attribute: t.name.startsWith("@") || t.name.startsWith(":") ? t.name : `@${name}`,
		property: camelCase(name),
		type: type(t.type),
		default: t.default,
		optional: t.optional,
		description: t.description,
	};
};

export const toAttr = (t: RawTag): AttrItem => ({
	name: t.name,
	type: type(t.type),
	default: t.default,
	optional: t.optional,
	description: t.description,
});

export const toCss = (t: RawTag): CssPropItem => ({
	...toNamed(t),
	syntax: t.type || undefined,
	default: t.default,
});

export const toEvent = (t: RawTag): EventItem => ({ ...toNamed(t), type: type(t.type) });

export const toDemo = (t: RawTag): DemoItem => ({ url: t.name, description: t.description });
