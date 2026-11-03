/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { dependenciesOf, resolveUses, topologicalOrder } from "../src/index.js";
import { cyclicDocument, makeDocument, makeRecord, sampleDocument } from "./helpers.js";

describe("resolveUses", () => {
	const graph = resolveUses(sampleDocument());

	it("maps uses from tag names and import paths", () => {
		expect(graph.get("app-shell")?.uses).toEqual(["app-nav", "icon-button"]);
	});
	it("records the reverse edges", () => {
		expect(graph.get("icon-button")?.usedBy).toEqual(["app-shell", "app-nav"]);
		expect(graph.get("app-nav")?.usedBy).toEqual(["app-shell"]);
	});
	it("lists tags and imports that match no record as unresolved", () => {
		expect(graph.get("app-nav")?.unresolved).toEqual(["sl-tab"]);
		expect(graph.get("icon-button")?.unresolved).toEqual([]);
	});
	it("matches an import on a segment boundary only", () => {
		const doc = makeDocument([
			makeRecord("xcard-x", { path: "components/xcard.webc" }),
			makeRecord("host-h", { path: "components/host.webc", webc: { imports: ["./card.webc"] } }),
		]);
		expect(resolveUses(doc).get("host-h")).toEqual({ uses: [], usedBy: [], unresolved: ["./card.webc"] });
	});
	it("resolves an import through parent segments by suffix", () => {
		const doc = makeDocument([
			makeRecord("shared-card", { path: "shared/card.webc" }),
			makeRecord("host-h", { path: "components/host.webc", webc: { imports: ["../shared/card.webc"] } }),
		]);
		expect(resolveUses(doc).get("host-h")?.uses).toEqual(["shared-card"]);
	});
});

describe("topologicalOrder", () => {
	it("puts used components before the components that use them", () => {
		expect(topologicalOrder(sampleDocument())).toEqual(["icon-button", "app-nav", "app-shell"]);
	});
	it("throws and names the cycle", () => {
		expect(() => topologicalOrder(cyclicDocument())).toThrow("Component cycle: cycle-a -> cycle-b -> cycle-a");
	});
});

describe("dependenciesOf", () => {
	const chain = makeDocument([
		makeRecord("a-a", { webc: { uses: ["b-b"] } }),
		makeRecord("b-b", { webc: { uses: ["c-c"] } }),
		makeRecord("c-c"),
	]);

	it("lists direct dependencies by default", () => {
		expect(dependenciesOf(chain, "a-a")).toEqual(["b-b"]);
	});
	it("follows every chain when transitive", () => {
		expect(dependenciesOf(chain, "a-a", { transitive: true })).toEqual(["b-b", "c-c"]);
	});
	it("never lists the component itself, even inside a cycle", () => {
		expect(dependenciesOf(cyclicDocument(), "cycle-a", { transitive: true })).toEqual(["cycle-b"]);
	});
	it("returns an empty list for an unknown tag", () => {
		expect(dependenciesOf(chain, "nope-nope", { transitive: true })).toEqual([]);
	});
});
