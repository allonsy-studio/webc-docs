/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { fileURLToPath } from "node:url";
import { create, ts } from "@custom-elements-manifest/analyzer";
import { webcModuleCreation, webcPlugin } from "../src/index.js";

export const FIXTURES = fileURLToPath(new URL("./fixtures/", import.meta.url));

/** Runs the analyzer over fixture files with both halves of the plugin. */
export function analyze(globs: string[], dev = false) {
	const modules = webcModuleCreation({ cwd: FIXTURES })({ ts, globs });
	return create({ modules, plugins: [webcPlugin({ cwd: FIXTURES })], context: { dev } });
}
