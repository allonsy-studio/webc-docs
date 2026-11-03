/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_HELPERS, parseAll } from "@allons-y/webcdoc";
import { beforeAll, describe, expect, it } from "vitest";

const pkg = fileURLToPath(new URL("..", import.meta.url));
const cli = join(pkg, "dist/bin/cli.js");

beforeAll(() => {
	if (!existsSync(cli)) execFileSync("yarn", ["run", "build"], { cwd: pkg });
}, 120_000);

/** Runs the built CLI and returns its stdout and exit code, whatever the exit code is. */
const run = (cwd: string, ...args: string[]) => {
	try {
		return { stdout: execFileSync("node", [cli, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
	} catch (e) {
		const err = e as { stdout: string; status: number };
		return { stdout: err.stdout, code: err.status };
	}
};

describe("cli", () => {
	it("lints a parsed document, exits 1 when a rule is an error, and exits 2 on bad usage", async () => {
		const dir = mkdtempSync(join(tmpdir(), "webcdoc-lint-cli-"));
		const fixtures = new URL("../../webcdoc/test/fixtures/*.webc", import.meta.url);
		const doc = { ...(await parseAll([fileURLToPath(fixtures)], {})), helpers: [...DEFAULT_HELPERS] };
		const file = join(dir, "webcdoc.json");
		writeFileSync(file, JSON.stringify(doc));

		const warn = run(dir, file);
		expect(warn.code).toBe(0);
		expect(warn.stdout).toMatch(/no-global-data/);
		expect(warn.stdout).toMatch(/Linted 5 components, 0 errors, \d+ warnings\n$/);

		const config = join(dir, "lint.json");
		writeFileSync(config, JSON.stringify({ rules: { "no-global-data": "error" } }));
		const failed = run(dir, file, "--config", config);
		expect(failed.code).toBe(1);
		expect(failed.stdout).toMatch(/no-global-data/);

		const json = JSON.parse(run(dir, file, "--config", config, "--format", "json").stdout);
		expect(json.summary.errors).toBeGreaterThan(0);

		const broken = join(dir, "broken.json");
		writeFileSync(broken, JSON.stringify({ ...doc, components: [{ ...doc.components[0], tagName: 5 }] }));
		const schema = run(dir, broken);
		expect(schema.code).toBe(1);
		expect(schema.stdout).toMatch(/^\/components\/0\/tagName schema /m);

		expect(run(dir).code).toBe(2);
		writeFileSync(join(dir, "nope.json"), "{");
		expect(run(dir, join(dir, "nope.json"))).toEqual({ stdout: "", code: 2 });
	}, 60_000);
});
