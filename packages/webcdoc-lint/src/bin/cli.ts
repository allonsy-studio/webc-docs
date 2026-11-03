#!/usr/bin/env node
/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import type { WebcdocDocument } from "@allons-y/webcdoc-schema";
import { loadConfig } from "../config.js";
import { lint } from "../lint.js";
import type { Finding, LintConfig, ValidationError } from "../types.js";
import { validate } from "../validate.js";

const USAGE = "Usage: webcdoc-lint <webcdoc.json> [--config file] [--format pretty|json]";

/** Exit 0 when clean, 1 when the document is invalid or has an error finding, 2 on bad usage or unreadable input. */
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

interface Summary {
	components: number;
	errors: number;
	warnings: number;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Prints schema errors (when invalid) or findings with a summary line, as pretty text or JSON. */
function report(format: string, schemaErrors: ValidationError[], findings: Finding[], summary?: Summary): void {
	if (format === "json") {
		console.log(JSON.stringify({ valid: schemaErrors.length === 0, errors: schemaErrors, findings, summary }, null, 2));
		return;
	}
	for (const e of schemaErrors) console.log(`${e.path || "/"} schema ${e.message}`);
	for (const f of findings) console.log(`${f.path}${f.line === undefined ? "" : `:${f.line}`} ${f.rule} ${f.message}`);
	if (summary) {
		console.log(`Linted ${plural(summary.components, "component")}, ${plural(summary.errors, "error")}, ${plural(summary.warnings, "warning")}`);
	} else {
		console.log(`Schema invalid: ${plural(schemaErrors.length, "error")}`);
	}
}

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		config: { type: "string" },
		format: { type: "string", default: "pretty" },
	},
});

async function readDocument(file: string): Promise<unknown> {
	try {
		return JSON.parse(await readFile(file, "utf8"));
	} catch (error) {
		if (error instanceof SyntaxError) throw new Error(`${file}: not valid JSON (${error.message})`);
		throw new Error(`Cannot read ${file}: ${(error as Error).message}`);
	}
}

async function main(): Promise<void> {
	const format = values.format;
	if (positionals.length !== 1 || (format !== "pretty" && format !== "json")) {
		console.error(USAGE);
		process.exitCode = EXIT_USAGE;
		return;
	}

	let doc: unknown;
	let config: LintConfig;
	try {
		doc = await readDocument(positionals[0]!);
		config = await loadConfig({ file: values.config });
	} catch (error) {
		console.error((error as Error).message);
		process.exitCode = EXIT_USAGE;
		return;
	}

	const schema = validate(doc);
	if (!schema.valid) {
		report(format, schema.errors, []);
		process.exitCode = EXIT_FAILED;
		return;
	}

	const { components } = doc as WebcdocDocument;
	const { findings } = lint(doc as WebcdocDocument, config);
	const errors = findings.filter((f) => f.severity === "error").length;
	report(format, [], findings, { components: components.length, errors, warnings: findings.length - errors });
	if (errors > 0) process.exitCode = EXIT_FAILED;
}

await main();
