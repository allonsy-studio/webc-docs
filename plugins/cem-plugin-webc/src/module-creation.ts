/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type tsType from "typescript";
import { readSource } from "./cache.js";
import { virtualSource } from "./virtual.js";

export interface WebcModuleCreationOptions {
	/** Directory the analyzer's globs are relative to. Defaults to the current directory. */
	cwd?: string;
}

/** Whether a path is a WebC component. */
export const isWebc = (path: string): boolean => path.endsWith(".webc");

/**
 * Returns an `overrideModuleCreation` function. JS and TS files get the
 * analyzer's default source file; each .webc file gets a virtual one holding
 * its client script.
 */
export function webcModuleCreation(options: WebcModuleCreationOptions = {}) {
	const cwd = options.cwd ?? process.cwd();
	return ({ ts, globs }: { ts: typeof tsType; globs: string[] }): tsType.SourceFile[] =>
		globs.map((glob) => {
			if (isWebc(glob)) {
				return ts.createSourceFile(glob, virtualSource(readSource(cwd, glob)), ts.ScriptTarget.ES2015, true, ts.ScriptKind.JS);
			}
			return ts.createSourceFile(glob, readFileSync(resolve(cwd, glob)).toString(), ts.ScriptTarget.ES2015, true);
		});
}
