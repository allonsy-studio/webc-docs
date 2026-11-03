/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { existsSync, readFileSync } from "node:fs";
import { glob, readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { SCHEMA_VERSION } from "@allons-y/webcdoc-schema";
import type { ComponentRecord, PackageWarning, WebcdocDocument } from "@allons-y/webcdoc-schema";
import { buildRecord } from "./merge.js";
import { DEFAULT_HELPERS } from "./references.js";
import { scan } from "./scan.js";

export type * from "@allons-y/webcdoc-schema";
export { SCHEMA_VERSION } from "@allons-y/webcdoc-schema";
export { DEFAULT_HELPERS } from "./references.js";
export { getCustomElements, isCustomElementDeclaration, isCustomElementExport, normalizeModulePath, toManifest } from "./emit/cem.js";

/** Package version, kept in step with package.json. */
export const VERSION = "0.1.0-beta.0";

export interface ParseOptions {
	/** Path recorded on the record; the file name gives the default tag name. */
	path?: string;
	/** Names a host provides; replaces the default list. */
	helpers?: string[];
	/** Directory paths are made relative to. Defaults to the current directory. */
	cwd?: string;
}

/** Parses one .webc source into a record. Problems become warnings, never exceptions. */
export function parse(source: string, options: ParseOptions = {}): ComponentRecord {
	return buildRecord(scan(source), { path: options.path ?? "", helpers: options.helpers ?? DEFAULT_HELPERS });
}

const posix = (p: string): string => p.replaceAll("\\", "/");

/** Reads and parses one file; the record's path is relative to `cwd`. */
export async function parseFile(file: string, options: ParseOptions = {}): Promise<ComponentRecord> {
	const cwd = options.cwd ?? process.cwd();
	const abs = isAbsolute(file) ? file : resolve(cwd, file);
	return parse(await readFile(abs, "utf8"), { ...options, path: posix(relative(cwd, abs)) });
}

/** Parses every file matching the globs into the grouped document. */
export async function parseAll(globs: string | string[], options: ParseOptions = {}): Promise<WebcdocDocument> {
	const cwd = options.cwd ?? process.cwd();
	const files = new Set<string>();
	for await (const f of glob(globs, { cwd })) files.add(posix(f));
	const components = await Promise.all([...files].sort().map((f) => parseFile(f, { ...options, cwd })));

	const byTag = new Map<string, string[]>();
	for (const c of components) byTag.set(c.tagName, [...(byTag.get(c.tagName) ?? []), c.path]);
	const warnings: PackageWarning[] = [...byTag]
		.filter(([, paths]) => paths.length > 1)
		.map(([tag, paths]) => ({ code: "duplicate-tag", message: `Tag name "${tag}" is used by ${paths.length} files.`, paths }));

	let pkg: { name?: string; version?: string } = {};
	try {
		const json = JSON.parse(readFileSync(resolve(cwd, "package.json"), "utf8")) as { name?: string; version?: string };
		pkg = { name: json.name, version: json.version };
	} catch {
		/* no package.json */
	}
	return {
		schemaVersion: SCHEMA_VERSION,
		generator: `@allons-y/webcdoc@${VERSION}`,
		package: pkg,
		...(existsSync(resolve(cwd, "README.md")) ? { readme: "README.md" } : {}),
		helpers: options.helpers ?? DEFAULT_HELPERS,
		components,
		warnings,
	};
}
