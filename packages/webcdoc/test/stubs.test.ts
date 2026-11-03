/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "../src/index.js";
import { scan } from "../src/scan.js";

/** Directory of WebC's own test stubs; set WEBC_STUBS_DIR to run this against them. */
const dir = process.env.WEBC_STUBS_DIR;

function walk(d: string): string[] {
	return readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".webc") ? [join(d, e.name)] : []));
}

describe.skipIf(!dir || !existsSync(dir))("WebC stubs", () => {
	const files = dir && existsSync(dir) ? walk(dir) : [];
	it("finds files", () => expect(files.length).toBeGreaterThan(0));
	it.each(files.map((f) => [f.slice(dir!.length + 1), f]))("never throws on %s", (_name, file) => {
		const src = readFileSync(file!, "utf8");
		expect(() => scan(src)).not.toThrow();
		expect(() => parse(src, { path: file })).not.toThrow();
	});
});
