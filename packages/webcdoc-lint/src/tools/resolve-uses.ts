/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord, WebcdocDocument } from "@allons-y/webcdoc-schema";
import { normalizePath } from "./paths.js";

/** One component's place in the use graph. */
export interface UseNode {
	/** Tag names this component depends on, in the order the template or imports reach them. */
	uses: string[];
	/** Tag names that depend on this component. */
	usedBy: string[];
	/** Tag names or import paths that match no record in the document. */
	unresolved: string[];
}

export interface DependencyOptions {
	/** Follow dependencies of dependencies. Defaults to false. */
	transitive?: boolean;
}

const push = (list: string[], value: string): void => {
	if (!list.includes(value)) list.push(value);
};

/** Finds the record an import path names: an exact match first, then a path ending in the import at a segment boundary. */
const findByImport = (records: ComponentRecord[], importPath: string): ComponentRecord | undefined => {
	const key = normalizePath(importPath).replace(/^(?:\.\.\/)+/, "");
	return (
		records.find((c) => normalizePath(c.path) === key) ??
		records.find((c) => normalizePath(c.path).endsWith(`/${key}`))
	);
};

/** Builds the use graph: each tag name maps to what it uses, what uses it, and what it cannot resolve. */
export function resolveUses(doc: WebcdocDocument): Map<string, UseNode> {
	const first = new Map<string, ComponentRecord>();
	for (const c of doc.components) if (!first.has(c.tagName)) first.set(c.tagName, c);

	const graph = new Map<string, UseNode>();
	for (const [tagName, record] of first) {
		const node: UseNode = { uses: [], usedBy: [], unresolved: [] };
		for (const tag of record.webc.uses) (first.has(tag) ? node.uses : node.unresolved).push(tag);
		for (const imp of record.webc.imports) {
			const target = findByImport(doc.components, imp);
			if (target) push(node.uses, target.tagName);
			else node.unresolved.push(imp);
		}
		node.uses = [...new Set(node.uses)];
		node.unresolved = [...new Set(node.unresolved)];
		graph.set(tagName, node);
	}
	for (const [tagName, node] of graph) {
		for (const dep of node.uses) push(graph.get(dep)!.usedBy, tagName);
	}
	return graph;
}

/** Orders tag names so every component comes after the components it uses. Throws on a cycle, naming it. */
export function topologicalOrder(doc: WebcdocDocument): string[] {
	const graph = resolveUses(doc);
	const state = new Map<string, "visiting" | "done">();
	const stack: string[] = [];
	const order: string[] = [];

	const visit = (tagName: string): void => {
		const seen = state.get(tagName);
		if (seen === "done") return;
		if (seen === "visiting") {
			const cycle = [...stack.slice(stack.indexOf(tagName)), tagName];
			throw new Error(`Component cycle: ${cycle.join(" -> ")}`);
		}
		state.set(tagName, "visiting");
		stack.push(tagName);
		for (const dep of graph.get(tagName)?.uses ?? []) visit(dep);
		stack.pop();
		state.set(tagName, "done");
		order.push(tagName);
	};

	for (const tagName of graph.keys()) visit(tagName);
	return order;
}

/** Lists the tag names a component uses, optionally following every chain. The component itself is never listed. */
export function dependenciesOf(doc: WebcdocDocument, tagName: string, options: DependencyOptions = {}): string[] {
	const graph = resolveUses(doc);
	const direct = graph.get(tagName)?.uses ?? [];
	if (!options.transitive) return [...direct];

	const out: string[] = [];
	const seen = new Set<string>([tagName]);
	const walk = (current: string): void => {
		for (const dep of graph.get(current)?.uses ?? []) {
			if (seen.has(dep)) continue;
			seen.add(dep);
			out.push(dep);
			walk(dep);
		}
	};
	walk(tagName);
	return out;
}
