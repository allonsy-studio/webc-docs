/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ruleNames } from "./rules/index.js";
import type { LintConfig, RuleSetting } from "./types.js";

/** A config file or value that cannot be used. */
export class ConfigError extends Error {
	override name = "ConfigError";
}

const SETTINGS: readonly RuleSetting[] = ["off", "warn", "error"];
const isObject = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object" && !Array.isArray(value);

/** Checks a parsed config value: an object with an optional `rules` map of known names to settings. */
export function parseConfig(value: unknown, source = "config"): LintConfig {
	if (!isObject(value)) throw new ConfigError(`${source}: expected an object`);
	const rulesValue = value.rules ?? {};
	if (!isObject(rulesValue)) throw new ConfigError(`${source}: "rules" must be an object`);
	for (const [name, setting] of Object.entries(rulesValue)) {
		if (!ruleNames.includes(name as never)) throw new ConfigError(`${source}: unknown rule "${name}"`);
		if (!SETTINGS.includes(setting as RuleSetting)) {
			throw new ConfigError(`${source}: rule "${name}" must be "off", "warn", or "error"`);
		}
	}
	return { rules: rulesValue as LintConfig["rules"] };
}

const readJson = async (file: string): Promise<unknown> => {
	let text: string;
	try {
		text = await readFile(file, "utf8");
	} catch (error) {
		throw new ConfigError(`${file}: cannot be read (${(error as Error).message})`);
	}
	try {
		return JSON.parse(text);
	} catch (error) {
		throw new ConfigError(`${file}: not valid JSON (${(error as Error).message})`);
	}
};

/**
 * Loads lint config. With `file`, reads that file. Otherwise reads `webcdoc-lint.config.json`
 * in `cwd`, then the `webcdocLint` key of `package.json` in `cwd`, then falls back to no rule overrides.
 */
export async function loadConfig(options: { file?: string; cwd?: string } = {}): Promise<LintConfig> {
	const cwd = options.cwd ?? process.cwd();
	if (options.file !== undefined) {
		return parseConfig(await readJson(options.file), options.file);
	}
	const own = join(cwd, "webcdoc-lint.config.json");
	const found = await readFile(own, "utf8").then(
		() => own,
		() => undefined,
	);
	if (found) return parseConfig(await readJson(found), found);

	const pkg = join(cwd, "package.json");
	const pkgJson = await readFile(pkg, "utf8").then(
		(text) => JSON.parse(text) as unknown,
		() => undefined,
	);
	if (isObject(pkgJson) && pkgJson.webcdocLint !== undefined) {
		return parseConfig(pkgJson.webcdocLint, `${pkg} (webcdocLint)`);
	}
	return {};
}
