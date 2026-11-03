/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { hasClientScript, hasWarning, isDeprecated, isDocumented, isPortable, rendersHostTag } from "../src/index.js";
import { makeRecord } from "./helpers.js";

describe("isDocumented", () => {
	it("is true for a summary, a description, or a documented prop or slot", () => {
		expect(isDocumented(makeRecord("a-a", { summary: "Short." }))).toBe(true);
		expect(isDocumented(makeRecord("a-a", { description: "Long." }))).toBe(true);
		expect(isDocumented(makeRecord("a-a", { props: [{ name: "x", attribute: "@x", property: "x", optional: true, description: "X." }] }))).toBe(true);
		expect(isDocumented(makeRecord("a-a", { slots: [{ name: "", description: "Body.", hasFallback: false, source: "template" }] }))).toBe(true);
	});
	it("is false for an undocumented prop or slot with no text", () => {
		expect(isDocumented(makeRecord("a-a", { props: [{ name: "x", attribute: "@x", property: "x", optional: true, description: "" }] }))).toBe(false);
		expect(isDocumented(makeRecord("a-a"))).toBe(false);
	});
});

describe("webc facts", () => {
	it("reads the client script and host flags", () => {
		const record = makeRecord("a-a", { webc: { clientScript: true, host: { rendered: true, reason: "root" } } });
		expect(hasClientScript(record)).toBe(true);
		expect(rendersHostTag(record)).toBe(true);
		expect(hasClientScript(makeRecord("a-a"))).toBe(false);
		expect(rendersHostTag(makeRecord("a-a"))).toBe(false);
	});
});

describe("isPortable", () => {
	it("is true only when data, helpers, and unresolved names are all empty", () => {
		expect(isPortable(makeRecord("a-a"))).toBe(true);
		expect(isPortable(makeRecord("a-a", { refs: { data: [{ path: "site.title", line: 1, in: "template" }] } }))).toBe(false);
		expect(isPortable(makeRecord("a-a", { refs: { helpers: [{ name: "url", line: 1, in: "template" }] } }))).toBe(false);
		expect(isPortable(makeRecord("a-a", { refs: { unresolved: [{ name: "foo", line: 1, in: "template" }] } }))).toBe(false);
	});
	it("ignores props, setup, and loop references", () => {
		expect(isPortable(makeRecord("a-a", { refs: { props: [{ name: "x", line: 1, in: "template" }], loops: [{ name: "item", line: 1, in: "template" }] } }))).toBe(true);
	});
});

describe("hasWarning", () => {
	it("matches a warning by code", () => {
		const record = makeRecord("a-a", { warnings: [{ code: "slot-missing", message: "No slot.", line: 3 }] });
		expect(hasWarning(record, "slot-missing")).toBe(true);
		expect(hasWarning(record, "regular-comment")).toBe(false);
	});
});

describe("isDeprecated", () => {
	it("is true for a flag or a non-empty reason", () => {
		expect(isDeprecated(makeRecord("a-a", { deprecated: true }))).toBe(true);
		expect(isDeprecated(makeRecord("a-a", { deprecated: "Use b-b." }))).toBe(true);
		expect(isDeprecated(makeRecord("a-a", { deprecated: "" }))).toBe(false);
		expect(isDeprecated(makeRecord("a-a"))).toBe(false);
	});
});
