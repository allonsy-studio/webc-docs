/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { WebcdocDocument } from "@allons-y/webcdoc-schema";

/** A page-data path or helper name that components read and the host must provide. */
export interface HostRequirement {
	kind: "data" | "helper";
	/** Data path such as `site.title`, or helper name such as `url`. */
	name: string;
	/** Tag names of the components that read it, in document order. */
	tagNames: string[];
}

/** True when `name` is `path` itself or a parent of it, so `site` covers `site.title`. */
const covers = (name: string, path: string): boolean => path === name || path.startsWith(`${name}.`);

/** Lists every data path and helper that any component reads, with the components that read each. */
export function hostRequirements(doc: WebcdocDocument): HostRequirement[] {
	const byKey = new Map<string, HostRequirement>();
	const add = (kind: HostRequirement["kind"], name: string, tagName: string): void => {
		const key = `${kind}:${name}`;
		const req = byKey.get(key) ?? { kind, name, tagNames: [] };
		if (!req.tagNames.includes(tagName)) req.tagNames.push(tagName);
		byKey.set(key, req);
	};
	for (const c of doc.components) {
		for (const ref of c.webc.references.data) if (ref.path !== undefined) add("data", ref.path, c.tagName);
		for (const ref of c.webc.references.helpers) if (ref.name !== undefined) add("helper", ref.name, c.tagName);
	}
	const rank = (r: HostRequirement): number => (r.kind === "data" ? 0 : 1);
	return [...byKey.values()].sort((a, b) => rank(a) - rank(b) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * Lists the components that need a data path or helper. A data query also matches
 * longer paths under it, so `site` finds components reading `site.title`.
 */
export function componentsUsing(doc: WebcdocDocument, name: string): string[] {
	const found: string[] = [];
	for (const c of doc.components) {
		const { data, helpers } = c.webc.references;
		const uses =
			data.some((ref) => ref.path !== undefined && covers(name, ref.path)) ||
			helpers.some((ref) => ref.name === name);
		if (uses && !found.includes(c.tagName)) found.push(c.tagName);
	}
	return found;
}
