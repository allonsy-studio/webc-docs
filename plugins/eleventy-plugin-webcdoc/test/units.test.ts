/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { collectHelpers, expandComponents, findWebcComponents, hasPath, resolveOptions, sharedWebcOptions } from "../src/index.js";

describe("resolveOptions", () => {
	it("fills the documented defaults", () => {
		expect(resolveOptions()).toEqual({
			components: undefined,
			helpers: [],
			output: "webcdoc.json",
			globalData: "webcdoc",
			renderExamples: false,
			warnOnMissingData: true,
		});
	});
});

describe("sharedWebcOptions", () => {
	it("returns one options object for both plugins", () => {
		expect(sharedWebcOptions("_components/**/*.webc", { useTransform: true })).toEqual({ components: "_components/**/*.webc", useTransform: true });
	});
});

describe("expandComponents", () => {
	it("keeps globs and drops a leading ./", () => {
		expect(expandComponents(["./_components/**/*.webc", "a/b.webc"])).toEqual(["_components/**/*.webc", "a/b.webc"]);
	});
	it("resolves npm: aliases under node_modules", () => {
		expect(expandComponents("npm:@scope/pkg/components/*.webc")).toEqual(["node_modules/@scope/pkg/components/*.webc"]);
	});
	it("turns an existing directory into a recursive glob", () => {
		expect(expandComponents("test/fixtures/site/_components")).toEqual(["test/fixtures/site/_components/**/*.webc"]);
	});
	it("rejects an unknown alias", () => {
		expect(() => expandComponents("foo:bar")).toThrow(/Unknown WebC alias "foo"/);
	});
});

describe("findWebcComponents", () => {
	const webcLike = function () {
		return "scopedHelpers useTransform";
	};
	it("reads components from the registered webc plugin", () => {
		expect(findWebcComponents({ plugins: [{ plugin: webcLike, options: { components: "x/*.webc" } }] } as never)).toBe("x/*.webc");
	});
	it("falls back to the webc plugin's default glob", () => {
		expect(findWebcComponents({ plugins: [{ plugin: webcLike, options: {} }] } as never)).toBe("_components/**/*.webc");
	});
	it("returns undefined when the plugin is absent", () => {
		expect(findWebcComponents({ plugins: [{ plugin: () => {}, options: {} }] } as never)).toBeUndefined();
	});
});

describe("collectHelpers", () => {
	it("merges functions, filters, and extra names without duplicates", () => {
		const config = { javascript: { functions: { url: 1, shout: 2 } }, getFilters: () => ({ shout: 2, slugify: 3 }) };
		expect(collectHelpers(config as never, ["extra", "url"])).toEqual(["extra", "shout", "slugify", "url"]);
	});
});

describe("hasPath", () => {
	const data = { site: { title: "t", fn: () => 1 }, list: [] };
	it("finds nested keys", () => {
		expect(hasPath(data, "site.title")).toBe(true);
		expect(hasPath(data, "site.nope")).toBe(false);
		expect(hasPath(data, "nope.deep")).toBe(false);
	});
	it("treats built-in roots as present", () => {
		expect(hasPath({}, "page.url")).toBe(true);
		expect(hasPath({}, "eleventy.version")).toBe(true);
	});
	it("treats anything below a function as present", () => {
		expect(hasPath(data, "site.fn.x")).toBe(true);
	});
});
