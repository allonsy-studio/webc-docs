/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { componentsUsing, hostRequirements } from "../src/index.js";
import { makeDocument, makeRecord } from "./fixtures.js";

const dataRef = (path: string) => ({ path, line: 1, in: "template" as const });
const helperRef = (name: string) => ({ name, line: 1, in: "template" as const });

const doc = makeDocument([
	makeRecord("app-nav", { refs: { data: [dataRef("site.title"), dataRef("site.nav")], helpers: [helperRef("url")] } }),
	makeRecord("page-footer", { refs: { data: [dataRef("site.title"), dataRef("year")], helpers: [helperRef("url"), helperRef("slugify")] } }),
	makeRecord("plain-card"),
]);

describe("hostRequirements", () => {
	it("unions data paths and helpers with the components that need each", () => {
		expect(hostRequirements(doc)).toEqual([
			{ kind: "data", name: "site.nav", tagNames: ["app-nav"] },
			{ kind: "data", name: "site.title", tagNames: ["app-nav", "page-footer"] },
			{ kind: "data", name: "year", tagNames: ["page-footer"] },
			{ kind: "helper", name: "slugify", tagNames: ["page-footer"] },
			{ kind: "helper", name: "url", tagNames: ["app-nav", "page-footer"] },
		]);
	});
	it("returns an empty list when nothing is read", () => {
		expect(hostRequirements(makeDocument([makeRecord("plain-card")]))).toEqual([]);
	});
});

describe("componentsUsing", () => {
	it("finds the components that read an exact data path or helper", () => {
		expect(componentsUsing(doc, "site.title")).toEqual(["app-nav", "page-footer"]);
		expect(componentsUsing(doc, "url")).toEqual(["app-nav", "page-footer"]);
		expect(componentsUsing(doc, "slugify")).toEqual(["page-footer"]);
	});
	it("matches a parent path against the longer paths under it", () => {
		expect(componentsUsing(doc, "site")).toEqual(["app-nav", "page-footer"]);
		expect(componentsUsing(doc, "si")).toEqual([]);
	});
	it("returns an empty list for a name nothing reads", () => {
		expect(componentsUsing(doc, "missing")).toEqual([]);
	});
});
