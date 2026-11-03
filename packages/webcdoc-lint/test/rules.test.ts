/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { rules } from "../src/index.js";
import { makeDocument, makeRecord } from "./helpers.js";

const ref = (name: string, line = 3) => ({ name, line, in: "template" as const });
const dataRef = (path: string, line = 3) => ({ path, line, in: "template" as const });
const warning = (code: string, line = 2) => ({ code: code as "slot-missing", message: `${code} message`, line });
const run = (name: keyof typeof rules, record = makeRecord("a-a"), doc = makeDocument([record])) => {
	const rule = rules[name];
	if (rule.scope !== "component") throw new Error(`${name} is a package rule`);
	return rule.check(record, doc);
};

describe("reference rules", () => {
	it("no-global-data flags each page-data read with its path and line", () => {
		const record = makeRecord("a-a", { refs: { data: [dataRef("site.title", 7)] } });
		expect(run("no-global-data", record)).toEqual([{ message: expect.stringContaining("$data.site.title"), line: 7 }]);
		expect(run("no-global-data")).toEqual([]);
	});

	it("no-undeclared-helper flags helper calls", () => {
		const record = makeRecord("a-a", { refs: { helpers: [ref("url", 4)] } });
		expect(run("no-undeclared-helper", record)).toEqual([{ message: expect.stringContaining('"url"'), line: 4 }]);
		expect(run("no-undeclared-helper")).toEqual([]);
	});

	it("no-unresolved flags identifiers that resolve to nothing", () => {
		const record = makeRecord("a-a", { refs: { unresolved: [ref("foo", 9)] } });
		expect(run("no-unresolved", record)).toEqual([{ message: expect.stringContaining('"foo"'), line: 9 }]);
		expect(run("no-unresolved")).toEqual([]);
	});
});

describe("warning-code rules", () => {
	it.each([
		["no-regular-comments", "regular-comment"],
		["require-prop-docs", "prop-undocumented"],
		["no-default-slot-fallback", "default-slot-fallback"],
		["no-missing-data", "data-missing"],
		["no-missing-import", "import-missing"],
	] as const)("%s reports only %s warnings", (rule, code) => {
		const record = makeRecord("a-a", { warnings: [warning(code, 5), warning("slot-missing")] });
		expect(run(rule, record)).toEqual([{ message: `${code} message`, line: 5 }]);
		expect(run(rule)).toEqual([]);
	});
});

describe("require-summary", () => {
	it("flags a component with no summary", () => {
		expect(run("require-summary", makeRecord("a-a", { summary: "" }))).toEqual([{ message: "Component has no @summary." }]);
		expect(run("require-summary", makeRecord("a-a", { summary: "Short." }))).toEqual([]);
	});
});

describe("no-duplicate-tag", () => {
	it("reports each duplicate tag name once, at its first path", () => {
		const doc = makeDocument([], [{ code: "duplicate-tag", message: 'Tag name "a-a" is used by 2 files.', paths: ["x/a.webc", "y/a.webc"] }]);
		const rule = rules["no-duplicate-tag"];
		if (rule.scope !== "package") throw new Error("expected a package rule");
		expect(rule.check(doc)).toEqual([{ message: 'Tag name "a-a" is used by 2 files. Paths: x/a.webc, y/a.webc', path: "x/a.webc" }]);
		expect(rule.check(makeDocument([]))).toEqual([]);
	});
});

describe("no-deprecated-use", () => {
	it("flags a use of a deprecated component and carries its reason", () => {
		const user = makeRecord("app-shell", { webc: { uses: ["old-nav"] } });
		const old = makeRecord("old-nav", { deprecated: "Use new-nav." });
		expect(run("no-deprecated-use", user, makeDocument([user, old]))).toEqual([
			{ message: "Uses <old-nav>, which is deprecated (Use new-nav)." },
		]);
	});

	it("ignores uses of current components and of tags outside the document", () => {
		const user = makeRecord("app-shell", { webc: { uses: ["new-nav", "other-package"] } });
		const current = makeRecord("new-nav", { deprecated: false });
		expect(run("no-deprecated-use", user, makeDocument([user, current]))).toEqual([]);
	});

	it("treats a boolean deprecation as deprecated without a reason", () => {
		const user = makeRecord("app-shell", { webc: { uses: ["old-nav"] } });
		const old = makeRecord("old-nav", { deprecated: true });
		expect(run("no-deprecated-use", user, makeDocument([user, old]))).toEqual([{ message: "Uses <old-nav>, which is deprecated." }]);
	});
});
