/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig, parseConfig } from "../src/index.js";

const dir = () => mkdtempSync(join(tmpdir(), "webcdoc-lint-"));

describe("parseConfig", () => {
	it("accepts rule overrides and an empty config", () => {
		expect(parseConfig({ rules: { "no-global-data": "off", "require-summary": "error" } })).toEqual({ rules: { "no-global-data": "off", "require-summary": "error" } });
		expect(parseConfig({})).toEqual({ rules: {} });
	});

	it("rejects a non-object, an unknown rule, and an unknown setting", () => {
		expect(() => parseConfig([])).toThrow(ConfigError);
		expect(() => parseConfig({ rules: { "no-such-rule": "warn" } })).toThrow('unknown rule "no-such-rule"');
		expect(() => parseConfig({ rules: { "require-summary": "loud" } })).toThrow('rule "require-summary" must be');
		expect(() => parseConfig({ rules: [] })).toThrow('"rules" must be an object');
	});
});

describe("loadConfig", () => {
	it("reads the file it is given", async () => {
		const file = join(dir(), "custom.json");
		writeFileSync(file, JSON.stringify({ rules: { "require-summary": "off" } }));
		expect(await loadConfig({ file })).toEqual({ rules: { "require-summary": "off" } });
	});

	it("reads webcdoc-lint.config.json in the working directory first", async () => {
		const cwd = dir();
		writeFileSync(join(cwd, "webcdoc-lint.config.json"), JSON.stringify({ rules: { "require-summary": "error" } }));
		writeFileSync(join(cwd, "package.json"), JSON.stringify({ webcdocLint: { rules: { "require-summary": "off" } } }));
		expect(await loadConfig({ cwd })).toEqual({ rules: { "require-summary": "error" } });
	});

	it("falls back to the webcdocLint key of package.json", async () => {
		const cwd = dir();
		writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "site", webcdocLint: { rules: { "require-summary": "off" } } }));
		expect(await loadConfig({ cwd })).toEqual({ rules: { "require-summary": "off" } });
	});

	it("returns an empty config when nothing is found", async () => {
		expect(await loadConfig({ cwd: dir() })).toEqual({});
	});

	it("names the file when it cannot be read", async () => {
		await expect(loadConfig({ file: join(dir(), "missing.json") })).rejects.toThrow(/missing\.json: cannot be read/);
	});

	it("names the file when its JSON is broken or a rule is unknown", async () => {
		const file = join(dir(), "broken.json");
		writeFileSync(file, "{ nope");
		await expect(loadConfig({ file })).rejects.toThrow(/broken\.json: not valid JSON/);
		writeFileSync(file, JSON.stringify({ rules: { bogus: "warn" } }));
		await expect(loadConfig({ file })).rejects.toThrow();
	});
});
