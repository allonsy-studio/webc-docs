/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const pkg = fileURLToPath(new URL("..", import.meta.url));
const cli = join(pkg, "dist/bin/cli.js");
const fixtures = join(pkg, "test/fixtures");

beforeAll(() => {
	if (!existsSync(cli)) execFileSync("yarn", ["run", "build"], { cwd: pkg });
}, 120_000);

describe("cli", () => {
	it("writes the document, manifest and split files, and fails strict on warnings", () => {
		const out = mkdtempSync(join(tmpdir(), "webcdoc-"));
		const run = (...args: string[]) => {
			try {
				return { stdout: execFileSync("node", [cli, ...args], { cwd: fixtures, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
			} catch (e) {
				const err = e as { stdout: string; status: number };
				return { stdout: err.stdout, code: err.status };
			}
		};
		const file = join(out, "webcdoc.json");
		const ok = run("skip-link.webc", "--out", file, "--manifest", "--split", "--strict");
		expect(ok).toEqual({ stdout: "Documented 1 component, 0 warnings\n", code: 0 });
		const doc = JSON.parse(readFileSync(file, "utf8"));
		expect(doc.components[0].tagName).toBe("skip-link");
		expect(JSON.parse(readFileSync(join(out, "custom-elements.json"), "utf8")).schemaVersion).toBe("2.1.0");
		expect(existsSync(join(out, "components/skip-link.json"))).toBe(true);

		const strict = run("*.webc", "--out", file, "--strict", "--helpers", "url");
		expect(strict.code).toBe(1);
		expect(strict.stdout).toMatch(/^Documented 5 components, \d+ warnings\n$/);
	});
});
