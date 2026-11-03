/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { getComponent, isDeprecated, resolveUses } from "@allons-y/webcdoc-tools";
import type { WebcdocDocument } from "@allons-y/webcdoc-schema";
import type { ComponentRule } from "./rule.js";

/** The use graph is built once per document, not once per component. */
const graphs = new WeakMap<WebcdocDocument, ReturnType<typeof resolveUses>>();
const graphOf = (doc: WebcdocDocument) => {
	let graph = graphs.get(doc);
	if (!graph) {
		graph = resolveUses(doc);
		graphs.set(doc, graph);
	}
	return graph;
};

/** Flags a component that uses another component marked deprecated. */
export const noDeprecatedUse: ComponentRule = {
	name: "no-deprecated-use",
	description: "Flags a component that uses another component marked deprecated.",
	defaultSeverity: "warn",
	scope: "component",
	check: (record, doc) =>
		(graphOf(doc).get(record.tagName)?.uses ?? []).flatMap((dep) => {
			const target = getComponent(doc, dep);
			if (!target || !isDeprecated(target)) return [];
			const note = typeof target.deprecated === "string" ? target.deprecated.replace(/\.$/, "") : "";
			const reason = note ? ` (${note})` : "";
			return [{ message: `Uses <${dep}>, which is deprecated${reason}.` }];
		}),
};
