/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFile } from "node:fs/promises";
import { parseAll } from "@allons-y/webcdoc";
import type { ComponentRecord, WebcdocDocument } from "@allons-y/webcdoc";
import { hasPath } from "./data.js";
import { renderExamples } from "./examples.js";
import { importExists, lineOf } from "./imports.js";

/** Package version, kept in step with package.json. */
export const VERSION = "0.1.0-beta.0";

export interface GenerateInput {
	/** Component globs, already expanded. */
	globs: string[];
	helpers: string[];
	/** Global data as templates see it. */
	data: Record<string, unknown>;
	/** Whether to warn on `$data` paths missing from `data`. */
	checkData: boolean;
	renderExamples: boolean;
	/** Functions Eleventy registers, handed to WebC as helpers while examples render. */
	functions?: Record<string, unknown>;
	root?: string;
	log: (message: string) => void;
}

/** Adds the `data-missing` warning for each `$data` path the global data does not contain. */
function checkData(record: ComponentRecord, data: Record<string, unknown>): void {
	const seen = new Set<string>();
	for (const ref of record.webc.references.data) {
		const path = ref.path ?? "";
		const key = `${path}:${ref.line}`;
		if (path === "" || seen.has(key) || hasPath(data, path)) continue;
		seen.add(key);
		record.warnings.push({ code: "data-missing", message: `$data.${path} is not in the global data.`, line: ref.line });
	}
}

/** Adds the `import-missing` warning for each `webc:import` that does not resolve to a file. */
async function checkImports(record: ComponentRecord, root: string): Promise<void> {
	const missing = record.webc.imports.filter((value) => !importExists(value, record.path, root));
	if (missing.length === 0) return;
	const source = await readFile(`${root}/${record.path}`, "utf8").catch(() => "");
	for (const value of missing) record.warnings.push({ code: "import-missing", message: `webc:import "${value}" does not resolve to a file.`, line: lineOf(source, value) });
}

/** Parses every component and layers on what only the Eleventy host knows. */
export async function generateDocument(input: GenerateInput): Promise<WebcdocDocument> {
	const root = input.root ?? process.cwd();
	const doc = await parseAll(input.globs, { helpers: input.helpers, cwd: root });
	for (const record of doc.components) {
		if (input.checkData) checkData(record, input.data);
		await checkImports(record, root);
		record.warnings.sort((a, b) => a.line - b.line);
	}
	if (input.renderExamples) await renderExamples(doc.components, input.globs, { data: input.data, functions: input.functions ?? {} }, input.log);
	return { ...doc, generator: `@allons-y/eleventy-plugin-webcdoc@${VERSION}` };
}
