/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord, References, WebcInfo, WebcdocDocument } from "@allons-y/webcdoc-schema";

const emptyReferences = (): References => ({ props: [], setup: [], loops: [], data: [], helpers: [], unresolved: [], webc: [] });

/** A record with empty facts, so each test states only what it checks. */
export function makeRecord(
	tagName: string,
	options: Partial<Omit<ComponentRecord, "webc">> & { webc?: Partial<WebcInfo>; refs?: Partial<References> } = {},
): ComponentRecord {
	const { webc, refs, ...rest } = options;
	const info: WebcInfo = {
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
		summary: "Summary.",
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
		webc: info,
	};
}

export function makeDocument(components: ComponentRecord[], warnings: WebcdocDocument["warnings"] = []): WebcdocDocument {
	return { schemaVersion: "1.0.0", generator: "test", package: { name: "fixture" }, helpers: [], components, warnings };
}
