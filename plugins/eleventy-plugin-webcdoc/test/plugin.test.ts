/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../../packages/webcdoc-lint/src/index.js";
import { SITE, build } from "./helpers.js";

const find = (doc: Awaited<ReturnType<typeof build>>["doc"], tag: string) => doc.components.find((c) => c.tagName === tag)!;

describe("document", () => {
	it("writes webcdoc.json with the generator string and both components", async () => {
		const { doc, files } = await build();
		expect(files).toContain("webcdoc.json");
		expect(doc.generator).toMatch(/^@allons-y\/eleventy-plugin-webcdoc@\d+\.\d+\.\d+/);
		expect(doc.components.map((c) => c.tagName)).toEqual(["page-card", "site-banner"]);
		expect(validate(doc)).toEqual({ valid: true, errors: [] });
	});

	it("reuses the components given to eleventy-plugin-webc", async () => {
		const { doc } = await build({ plugin: {} });
		expect(doc.components).toHaveLength(2);
	});

	it("prefers its own components option", async () => {
		const { doc } = await build({ plugin: { components: `${SITE}/_components/site-banner.webc` } });
		expect(doc.components.map((c) => c.tagName)).toEqual(["site-banner"]);
	});

	it("exposes the document as global data to templates", async () => {
		const { page } = await build();
		expect(page).toContain("Components: 2");
	});

	it("uses a custom global data key", async () => {
		const { page } = await build({ plugin: { globalData: "docs" } });
		expect(page).toContain("Components: 0");
	});

	it("takes components from its own option when eleventy-plugin-webc is absent", async () => {
		const { doc } = await build({ webc: false, plugin: { components: `${SITE}/_components/*.webc` } });
		expect(doc.components).toHaveLength(2);
	});

	it("writes nothing when output is false", async () => {
		const { files } = await build({ plugin: { output: false } });
		expect(files).not.toContain("webcdoc.json");
	});

	it("uses a custom output name", async () => {
		const { files } = await build({ plugin: { output: "docs/components.json" } });
		expect(files).toContain("docs/components.json");
	});
});

describe("helpers", () => {
	it("lists registered filters and Eleventy's own functions, merged with the option", async () => {
		const { doc } = await build({ plugin: { helpers: ["custom"] } });
		expect(doc.helpers).toEqual(expect.arrayContaining(["shout", "url", "slugify", "custom"]));
	});

	it("resolves a registered filter instead of leaving it unresolved", async () => {
		const { doc } = await build();
		const refs = find(doc, "site-banner").webc.references;
		expect(refs.helpers.map((r) => r.name)).toContain("shout");
		expect(refs.unresolved.map((r) => r.name)).not.toContain("shout");
	});
});

describe("data check", () => {
	it("warns on a $data path missing from the global data", async () => {
		const { doc } = await build();
		const card = find(doc, "page-card");
		expect(card.warnings).toContainEqual({ code: "data-missing", message: "$data.site.subtitle is not in the global data.", line: 14 });
	});

	it("accepts paths found in _data and built-in roots", async () => {
		const { doc } = await build();
		expect(find(doc, "site-banner").warnings.filter((w) => w.code === "data-missing")).toEqual([]);
		expect(find(doc, "page-card").warnings.filter((w) => w.message.includes("page.url"))).toEqual([]);
	});

	it("skips the check when warnOnMissingData is false", async () => {
		const { doc } = await build({ plugin: { warnOnMissingData: false } });
		expect(doc.components.flatMap((c) => c.warnings).filter((w) => w.code === "data-missing")).toEqual([]);
	});
});

describe("imports", () => {
	it("warns on a webc:import that does not resolve and not on one that does", async () => {
		const { doc } = await build();
		const warnings = find(doc, "page-card").warnings.filter((w) => w.code === "import-missing");
		expect(warnings).toEqual([{ code: "import-missing", message: 'webc:import "./does-not-exist.webc" does not resolve to a file.', line: 12 }]);
	});
});

describe("examples", () => {
	it("leaves html off by default", async () => {
		const { doc } = await build();
		expect(find(doc, "site-banner").examples[0]).not.toHaveProperty("html");
	});

	it("renders each example through WebC when renderExamples is on", async () => {
		const { doc } = await build({ plugin: { renderExamples: true } });
		expect(find(doc, "page-card").examples[1]!.html).toContain("<h1>");
		expect(find(doc, "site-banner").examples[0]!.html).toContain("<header>");
		expect(validate(doc).valid).toBe(true);
	});
});
