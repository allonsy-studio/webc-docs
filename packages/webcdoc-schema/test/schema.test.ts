/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "../src/index.js";

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));

describe("schema package", () => {
	it("keeps the version constant in step with package.json", () => {
		expect(SCHEMA_VERSION).toBe(read("../package.json").version);
	});
	it("lists every warning code", () => {
		const defs = read("../schema.json").$defs;
		expect(defs.warning.properties.code.enum).toContain("prop-undocumented");
		expect(defs.warning.properties.code.enum).toEqual(expect.arrayContaining(["data-missing", "import-missing"]));
		expect(defs.packageWarning.properties.code.const).toBe("duplicate-tag");
	});
});
