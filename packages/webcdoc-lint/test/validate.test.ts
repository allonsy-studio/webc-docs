/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFileSync, readdirSync } from "node:fs";
import { DEFAULT_HELPERS, parse, type ComponentRecord } from "@allons-y/webcdoc";
import { describe, expect, it } from "vitest";
import { validate } from "../src/index.js";
import { makeDocument, makeRecord } from "./helpers.js";

const fixtures = new URL("../../webcdoc/test/fixtures/", import.meta.url);
const parsed = readdirSync(fixtures)
	.filter((f) => f.endsWith(".webc"))
	.map((f) => parse(readFileSync(new URL(f, fixtures), "utf8"), { path: `components/${f}` }));

describe("validate", () => {
	it("accepts the parser's output for every fixture", () => {
		expect(parsed.length).toBeGreaterThan(0);
		const doc = { ...makeDocument(parsed), helpers: [...DEFAULT_HELPERS] };
		expect(validate(doc)).toEqual({ valid: true, errors: [] });
	});

	it.each(parsed.map((r) => [r.tagName, r] as const))("accepts %s on its own", (_tag, record) => {
		expect(validate({ ...makeDocument([record]), helpers: [...DEFAULT_HELPERS] }).valid).toBe(true);
	});

	it("treats undefined fields as absent", () => {
		const record = makeRecord("a-a", { props: [{ name: "x", attribute: "@x", property: "x", optional: true, description: "", default: undefined }] });
		expect(validate(makeDocument([record]))).toEqual({ valid: true, errors: [] });
	});

	it("reports the JSON Pointer of a wrong value", () => {
		const doc = makeDocument([makeRecord("a-a")]);
		const bad = { ...doc, components: [{ ...doc.components[0], tagName: 5 }] };
		const result = validate(bad);
		expect(result.valid).toBe(false);
		expect(result.errors).toContainEqual({ path: "/components/0/tagName", message: expect.any(String) });
	});

	it("rejects a warning code the schema does not list", () => {
		const record = makeRecord("a-a", { warnings: [{ code: "made-up" as "slot-missing", message: "x", line: 1 }] });
		const result = validate(makeDocument([record]));
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.path.startsWith("/components/0/warnings/0"))).toBe(true);
	});

	it("rejects a missing required top-level field", () => {
		const rest: Record<string, unknown> = { ...makeDocument([]) };
		delete rest.helpers;
		const result = validate(rest);
		expect(result.valid).toBe(false);
		expect(result.errors.map((e) => e.message).join(" ")).toMatch(/helpers/);
	});

	it("rejects an extra field on a component", () => {
		const record = { ...makeRecord("a-a"), extra: true } as unknown as ComponentRecord;
		expect(validate(makeDocument([record])).valid).toBe(false);
	});

	it("rejects values that are not JSON or not an object", () => {
		expect(validate(undefined).valid).toBe(false);
		expect(validate("doc").errors).toEqual([{ path: "", message: "Document must be an object" }]);
		expect(validate(null).valid).toBe(false);
	});
});
