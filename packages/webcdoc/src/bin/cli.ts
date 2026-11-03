#!/usr/bin/env node
/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { parseAll, toManifest } from "../index.js";

const USAGE = `Usage: webcdoc <glob...> [--out webcdoc.json] [--split] [--manifest] [--strict] [--helpers a,b]`;

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		out: { type: "string", default: "webcdoc.json" },
		split: { type: "boolean", default: false },
		manifest: { type: "boolean", default: false },
		strict: { type: "boolean", default: false },
		helpers: { type: "string" },
	},
});

if (!positionals.length) {
	console.error(USAGE);
	process.exit(2);
}

const write = async (file: string, data: unknown): Promise<void> => {
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
};

const doc = await parseAll(positionals, { helpers: values.helpers?.split(",").map((h) => h.trim()).filter(Boolean) });
const out = resolve(values.out);
await write(out, doc);
if (values.manifest) await write(join(dirname(out), "custom-elements.json"), toManifest(doc.components, doc));
if (values.split) for (const c of doc.components) await write(join(dirname(out), "components", `${c.tagName}.json`), c);

const warnings = doc.components.reduce((n, c) => n + c.warnings.length, doc.warnings.length);
for (const c of doc.components) for (const w of c.warnings) console.error(`${c.path}:${w.line} ${w.code} ${w.message}`);
for (const w of doc.warnings) console.error(`${w.code} ${w.message}`);
const n = doc.components.length;
console.log(`Documented ${n} component${n === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}`);
if (values.strict && warnings) process.exitCode = 1;
