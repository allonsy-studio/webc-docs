/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/** Version of the document format; tracks this package's version. */
export const SCHEMA_VERSION = "1.0.0-beta.0";

/** Documentation tags the parser knows. Other tags land in `tags`. */
export type TagName =
	| "summary"
	| "tag"
	| "prop"
	| "attr"
	| "slot"
	| "cssprop"
	| "csspart"
	| "cssstate"
	| "fires"
	| "example"
	| "demo"
	| "deprecated"
	| "since";

/** Stable warning codes; a linter can key on these. */
export type WarningCode =
	| "slot-missing"
	| "default-slot-fallback"
	| "prop-undocumented"
	| "regular-comment"
	| "duplicate-tag"
	| "host-no-display"
	| "data-missing"
	| "import-missing";

export interface TypeInfo {
	text: string;
}
export interface NamedItem {
	name: string;
	description: string;
}
export interface PropItem {
	name: string;
	/** Authored spelling, with the `@`. */
	attribute: string;
	/** camelCase name WebC passes to the template. */
	property: string;
	type?: TypeInfo;
	default?: string;
	optional: boolean;
	description: string;
}
export interface AttrItem {
	name: string;
	type?: TypeInfo;
	default?: string;
	optional: boolean;
	description: string;
}
export interface SlotItem extends NamedItem {
	hasFallback: boolean;
	source: "template";
}
export interface CssPropItem extends NamedItem {
	syntax?: string;
	default?: string;
}
export interface EventItem extends NamedItem {
	type?: TypeInfo;
}
export interface ExampleItem {
	title: string;
	code: string;
	/** Rendered output, added by a host that compiles examples. */
	html?: string;
}
export interface DemoItem {
	url: string;
	description: string;
}
export interface TagItem {
	name: string;
	description: string;
}

/** A problem found in one component. */
export interface Warning {
	code: WarningCode;
	message: string;
	line: number;
}
/** A problem found across components. */
export interface PackageWarning {
	code: "duplicate-tag";
	message: string;
	paths: string[];
}

export interface HostInfo {
	rendered: boolean;
	reason: "root" | "root-override" | "style" | "script" | "stylesheet" | "shadow-dom" | "none";
}
export interface SetupExport {
	name: string;
	kind: "function" | "class" | "variable";
	description: string;
}

/** One place an identifier or path is read. */
export interface Reference {
	name?: string;
	path?: string;
	line: number;
	in: "template" | "setup";
}
export interface References {
	props: Reference[];
	setup: Reference[];
	loops: Reference[];
	data: Reference[];
	helpers: Reference[];
	unresolved: Reference[];
	webc: Reference[];
}

export interface WebcInfo {
	host: HostInfo;
	setup: { exports: SetupExport[]; imports: string[] };
	styles: { present: boolean; scope: "webc:scoped" | null; hash?: string; keep?: boolean; bucket?: string; nobundle?: boolean };
	clientScript: boolean;
	imports: string[];
	uses: string[];
	shadowDom: boolean;
	transforms: string[];
	references: References;
}

/** One component, as parsed from one .webc file. */
export interface ComponentRecord {
	path: string;
	tagName: string;
	summary: string;
	description: string;
	props: PropItem[];
	attributes: AttrItem[];
	slots: SlotItem[];
	cssProperties: CssPropItem[];
	cssParts: NamedItem[];
	cssStates: NamedItem[];
	events: EventItem[];
	examples: ExampleItem[];
	demos: DemoItem[];
	/** `true`, or the reason string. */
	deprecated: boolean | string;
	tags: Record<string, TagItem[]>;
	webc: WebcInfo;
	warnings: Warning[];
}

/** The grouped document the CLI writes by default. */
export interface WebcdocDocument {
	schemaVersion: string;
	generator: string;
	package: { name?: string; version?: string };
	readme?: string;
	helpers: string[];
	components: ComponentRecord[];
	warnings: PackageWarning[];
}
