/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/** Names of what a component reads from the host, for the requires line. */
const hostReads = (component) => {
	const references = component?.webc?.references ?? {};
	const pick = (list, key) => [...new Set((list ?? []).map((entry) => entry[key] ?? entry.name).filter(Boolean))];
	return [
		...pick(references.data, "path").map((name) => ({ kind: "data", name })),
		...pick(references.helpers, "name").map((name) => ({ kind: "helper", name })),
		...pick(references.unresolved, "name").map((name) => ({ kind: "undocumented", name })),
	];
};

export default {
	permalink: (data) => (data.component ? `components/${data.component.tagName}/index.html` : true),
	eleventyComputed: {
		title: (data) => data.component?.tagName ?? data.title,
		description: (data) => data.component?.summary ?? data.description,
		requires: (data) => hostReads(data.component),
	},
};
