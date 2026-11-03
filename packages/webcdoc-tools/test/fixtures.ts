/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord, References, WebcInfo, WebcdocDocument, Reference } from "@allons-y/webcdoc-schema";

const ref = (name: string, line = 1): Reference => ({ name, line, in: "template" });
const dataRef = (path: string, line = 1): Reference => ({ path, line, in: "template" });

export const emptyReferences = (): References => ({ props: [], setup: [], loops: [], data: [], helpers: [], unresolved: [], webc: [] });

/** A full record with empty facts, so tests only state what they check. */
export function makeRecord(
	tagName: string,
	options: Partial<Omit<ComponentRecord, "webc">> & { webc?: Partial<WebcInfo>; refs?: Partial<References> } = {},
): ComponentRecord {
	const { webc, refs, ...rest } = options;
	const webcInfo: WebcInfo = {
		host: { rendered: false, reason: "none" },
		setup: { exports: [], imports: [] },
		styles: { present: false, scope: null },
		clientScript: false,
		imports: [],
		uses: [],
		shadowDom: false,
		transforms: [],
		references: { ...emptyReferences(), ...refs },
		...webc,
	};
	return {
		path: `components/${tagName}.webc`,
		tagName,
		summary: "",
		description: "",
		props: [],
		attributes: [],
		slots: [],
		cssProperties: [],
		cssParts: [],
		cssStates: [],
		events: [],
		examples: [],
		demos: [],
		deprecated: false,
		tags: {},
		warnings: [],
		...rest,
		webc: webcInfo,
	};
}

export function makeDocument(components: ComponentRecord[]): WebcdocDocument {
	return { schemaVersion: "1.0.0", generator: "test", package: { name: "fixture" }, helpers: [], components, warnings: [] };
}

/**
 * Three components: `app-shell` uses `app-nav` and imports the icon button by path;
 * `app-nav` uses `icon-button` and a tag from another package; `icon-button` uses nothing.
 */
export function sampleDocument(): WebcdocDocument {
	return makeDocument([
		makeRecord("app-shell", {
			path: "./components/app-shell.webc",
			summary: "Page frame.",
			webc: { uses: ["app-nav"], imports: ["./parts/icon-button.webc"], clientScript: true, host: { rendered: true, reason: "style" } },
		}),
		makeRecord("app-nav", {
			path: "components/app-nav.webc",
			webc: { uses: ["icon-button", "sl-tab"] },
			refs: { data: [dataRef("site.title")], helpers: [ref("url")] },
		}),
		makeRecord("icon-button", {
			path: "components/parts/icon-button.webc",
			description: "Icon-only button.",
			deprecated: "Use sl-button.",
		}),
	]);
}

/** Two components that import each other, so no order exists. */
export function cyclicDocument(): WebcdocDocument {
	return makeDocument([
		makeRecord("cycle-a", { webc: { uses: ["cycle-b"] } }),
		makeRecord("cycle-b", { webc: { imports: ["./cycle-a.webc"] } }),
	]);
}
