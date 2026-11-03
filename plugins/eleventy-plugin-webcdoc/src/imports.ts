/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { existsSync } from "node:fs";
import { dirname, posix, resolve } from "node:path";

/** Where a `webc:import` value points on disk: `npm:` under node_modules, `~/` from the root, else beside the component. */
export function resolveImport(value: string, componentPath: string, root = process.cwd()): string {
	if (value.startsWith("npm:")) return resolve(root, "node_modules", value.slice(4));
	if (value.startsWith("~/")) return resolve(root, value.slice(2));
	return resolve(root, dirname(componentPath), value);
}

export const importExists = (value: string, componentPath: string, root = process.cwd()): boolean =>
	existsSync(resolveImport(value, componentPath, root));

/** 1-based line of the first occurrence of `needle` in `source`, or 1 when absent. */
export function lineOf(source: string, needle: string): number {
	const index = source.indexOf(needle);
	return index < 0 ? 1 : source.slice(0, index).split("\n").length;
}

export const toPosix = (p: string): string => p.split("\\").join(posix.sep);
