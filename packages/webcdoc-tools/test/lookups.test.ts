/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { getComponent, getComponentByPath, listTagNames, normalizePath } from "../src/index.js";
import { makeDocument, makeRecord, sampleDocument } from "./helpers.js";

describe("normalizePath", () => {
	it("drops leading ./, collapses slashes, and uses forward slashes", () => {
		expect(normalizePath("./components/card.webc")).toBe("components/card.webc");
		expect(normalizePath("components//parts///card.webc")).toBe("components/parts/card.webc");
		expect(normalizePath("components\\parts\\card.webc")).toBe("components/parts/card.webc");
		expect(normalizePath("card.webc")).toBe("card.webc");
	});
	it("leaves parent segments alone", () => {
		expect(normalizePath("../shared/card.webc")).toBe("../shared/card.webc");
	});
});

describe("getComponent", () => {
	const doc = sampleDocument();
	it("finds a record by tag name", () => {
		expect(getComponent(doc, "app-nav")?.path).toBe("components/app-nav.webc");
	});
	it("returns undefined for an unknown tag", () => {
		expect(getComponent(doc, "nope-nope")).toBeUndefined();
	});
});

describe("getComponentByPath", () => {
	const doc = sampleDocument();
	it("matches paths that differ only by ./ or slash spelling", () => {
		expect(getComponentByPath(doc, "components/app-shell.webc")?.tagName).toBe("app-shell");
		expect(getComponentByPath(doc, "./components//app-nav.webc")?.tagName).toBe("app-nav");
	});
	it("returns undefined when no path matches", () => {
		expect(getComponentByPath(doc, "components/missing.webc")).toBeUndefined();
	});
});

describe("listTagNames", () => {
	it("lists each tag once in document order", () => {
		const doc = makeDocument([makeRecord("b-b"), makeRecord("a-a"), makeRecord("b-b", { path: "other/b-b.webc" })]);
		expect(listTagNames(doc)).toEqual(["b-b", "a-a"]);
	});
});
