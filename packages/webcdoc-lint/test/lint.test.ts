/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFileSync } from "node:fs";
import { parse } from "@allons-y/webcdoc";
import { describe, expect, it } from "vitest";
import { ConfigError, lint, resolveSettings, ruleNames } from "../src/index.js";
import { makeDocument, makeRecord } from "./helpers.js";

const load = (name: string) => parse(readFileSync(new URL(`../../webcdoc/test/fixtures/${name}.webc`, import.meta.url), "utf8"), { path: `components/${name}.webc` });

describe("resolveSettings", () => {
	it("uses each rule's default when the config is empty", () => {
		const settings = resolveSettings({});
		expect(Object.keys(settings).sort()).toEqual([...ruleNames].sort());
		expect(settings["no-duplicate-tag"]).toBe("error");
		expect(settings["no-global-data"]).toBe("warn");
	});

	it("overlays overrides on the defaults", () => {
		const settings = resolveSettings({ rules: { "no-global-data": "off", "require-summary": "error" } });
		expect(settings["no-global-data"]).toBe("off");
		expect(settings["require-summary"]).toBe("error");
		expect(settings["no-unresolved"]).toBe("warn");
	});
});

describe("lint", () => {
	it("reports the expected rules on the data-coupled fixture", () => {
		const doc = makeDocument([load("data-coupled")]);
		const rules = lint(doc).findings.map((f) => f.rule);
		expect(rules).toEqual(expect.arrayContaining(["no-global-data", "no-undeclared-helper", "no-unresolved", "require-prop-docs"]));
		expect(rules).toContain("require-summary");
	});

	it("reports nothing that a clean component does not trip", () => {
		const clean = makeRecord("a-a", { summary: "Clean." });
		expect(lint(makeDocument([clean])).findings).toEqual([]);
	});

	it("skips rules set to off and changes severity when a rule is set to error", () => {
		const doc = makeDocument([load("data-coupled")]);
		const findings = lint(doc, { rules: { "no-global-data": "error", "no-unresolved": "off", "require-prop-docs": "off" } }).findings;
		expect(findings.some((f) => f.rule === "no-unresolved")).toBe(false);
		expect(findings.filter((f) => f.rule === "no-global-data")).toEqual([
			expect.objectContaining({ severity: "error", tagName: "data-coupled", path: "components/data-coupled.webc", line: 6 }),
		]);
	});

	it("reports a package-level duplicate once with no tag name", () => {
		const doc = makeDocument([makeRecord("a-a"), makeRecord("a-a")], [
			{ code: "duplicate-tag", message: 'Tag name "a-a" is used by 2 files.', paths: ["one/a.webc", "two/a.webc"] },
		]);
		const duplicates = lint(doc).findings.filter((f) => f.rule === "no-duplicate-tag");
		expect(duplicates).toEqual([
			{ rule: "no-duplicate-tag", severity: "error", path: "one/a.webc", message: 'Tag name "a-a" is used by 2 files. Paths: one/a.webc, two/a.webc' },
		]);
	});

	it("runs no-missing-data and no-missing-import on codes the Eleventy plugin will add", () => {
		const record = makeRecord("a-a", {
			summary: "Clean.",
			warnings: [
				{ code: "data-missing" as "slot-missing", message: "No data at site.title.", line: 4 },
				{ code: "import-missing" as "slot-missing", message: "No file ./x.webc.", line: 5 },
			],
		});
		expect(lint(makeDocument([record])).findings.map((f) => [f.rule, f.line])).toEqual([
			["no-missing-data", 4],
			["no-missing-import", 5],
		]);
	});

	it("rejects an unknown rule name in the config", () => {
		expect(() => lint(makeDocument([]), { rules: { "no-such-rule": "warn" } as never })).toThrow(ConfigError);
	});
});
