/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord } from "@allons-y/webcdoc-schema";
import type {
	Attribute,
	CustomElementDeclaration,
	CustomElementExport,
	Declaration,
	JavaScriptModule,
	Package,
} from "custom-elements-manifest/schema.js";

/** A custom element declaration that also carries WebC-only facts. */
export type WebcDeclaration = CustomElementDeclaration & { webc: Pick<ComponentRecord, "webc" | "examples" | "props" | "tags">["webc"] & Record<string, unknown> };

export const isCustomElementDeclaration = (d: Declaration): d is CustomElementDeclaration =>
	d.kind === "class" && (d as CustomElementDeclaration).customElement === true;

export const isCustomElementExport = (e: { kind: string }): e is CustomElementExport => e.kind === "custom-element-definition";

/** Removes a leading `./` or `/` and uses forward slashes, so paths compare. */
export const normalizeModulePath = (path: string): string => path.replaceAll("\\", "/").replace(/^(?:\.?\/)+/, "");

/** `skip-link` becomes `SkipLink`. */
export const pascalCase = (tag: string): string => tag.replace(/(?:^|-)([a-z0-9])/gi, (_, c: string) => c.toUpperCase());

/** Drops keys whose value is undefined or an empty string. */
const compact = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as T;

function toDeclaration(r: ComponentRecord): WebcDeclaration {
	const attributes: Attribute[] = [
		...r.props.map((p) => compact({ name: p.name, description: p.description, type: p.type, default: p.default, fieldName: p.property })),
		...r.attributes.map((a) => compact({ name: a.name, description: a.description, type: a.type, default: a.default })),
	];
	return {
		kind: "class",
		customElement: true,
		name: pascalCase(r.tagName),
		tagName: r.tagName,
		...compact({ summary: r.summary, description: r.description }),
		...(r.deprecated ? { deprecated: r.deprecated } : {}),
		attributes,
		slots: r.slots.map((s) => ({ name: s.name, ...compact({ description: s.description }) })),
		cssProperties: r.cssProperties.map(compact),
		cssParts: r.cssParts.map(compact),
		cssStates: r.cssStates.map(compact),
		events: r.events.map((e) => ({ ...compact(e), type: e.type ?? { text: "Event" } })),
		demos: r.demos.map(compact),
		webc: { ...r.webc, examples: r.examples, tags: r.tags } as WebcDeclaration["webc"],
	};
}

/** Builds a Custom Elements Manifest from records: one module per component. */
export function toManifest(records: ComponentRecord[], pkg: { readme?: string } = {}): Package {
	const modules: JavaScriptModule[] = records.map((r) => {
		const declaration = toDeclaration(r);
		return {
			kind: "javascript-module",
			path: normalizeModulePath(r.path),
			declarations: [declaration],
			exports: [{ kind: "custom-element-definition", name: r.tagName, declaration: { name: declaration.name, module: normalizeModulePath(r.path) } }],
		};
	});
	return { schemaVersion: "2.1.0", ...(pkg.readme ? { readme: pkg.readme } : {}), modules };
}

/** Every custom element declaration in a manifest, with its module path. */
export function getCustomElements(manifest: Package): { module: string; declaration: CustomElementDeclaration }[] {
	return manifest.modules.flatMap((m) =>
		(m.declarations ?? []).filter(isCustomElementDeclaration).map((declaration) => ({ module: m.path, declaration })),
	);
}
