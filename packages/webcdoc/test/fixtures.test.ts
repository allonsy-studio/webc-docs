/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "../src/index.js";

const fixtures = ["skip-link", "header-only", "undocumented", "data-coupled", "client"];
const load = (name: string) => parse(readFileSync(new URL(`./fixtures/${name}.webc`, import.meta.url), "utf8"), { path: `components/${name}.webc` });

describe("fixtures", () => {
	it.each(fixtures)("%s", (name) => {
		expect(load(name)).toMatchSnapshot();
	});

	it("prefers in-place docs over the header", () => {
		const r = parse("<!---\n@slot icon - From header.\n--->\n<!--- Inline wins. --->\n<slot name=\"icon\"></slot>");
		expect(r.slots[0]!.description).toBe("Inline wins.");
	});

	it("warns, not throws, for a documented slot with no <slot>", () => {
		expect(load("header-only").warnings.map((w) => w.code)).toEqual(["slot-missing", "default-slot-fallback"]);
	});

	it("lets @tag override the file name", () => {
		expect(parse("<!--- @tag x-y --->\n<p></p>", { path: "a/b.webc" }).tagName).toBe("x-y");
		expect(parse("<p></p>", { path: "a/b.webc" }).tagName).toBe("b");
	});

	it("honors a custom helper list", () => {
		const r = parse("<p :a=\"mine(1)\"></p>", { helpers: ["mine"] });
		expect(r.webc.references.helpers.map((h) => h.name)).toEqual(["mine"]);
		expect(r.warnings).toEqual([]);
	});

	it("reports setup reads", () => {
		const r = parse("<script webc:setup>\nconst a = url('/x') + $data.site + unknownThing;\n</script>");
		const { helpers, data, unresolved } = r.webc.references;
		expect(helpers).toEqual([{ name: "url", line: 2, in: "setup" }]);
		expect(data[0]).toMatchObject({ path: "site", in: "setup" });
		expect(unresolved.map((u) => u.name)).toEqual(["unknownThing"]);
	});
});
