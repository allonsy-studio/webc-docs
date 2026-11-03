/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { statSync } from "node:fs";
import { posix } from "node:path";

const isGlob = (s: string): boolean => /[*?[\]{}()!]/.test(s);

/**
 * Turns the `components` option into plain globs.
 * `npm:name/path` resolves under `./node_modules/` like the webc plugin; a bare directory means every .webc file inside it.
 */
export function expandComponents(components: string | string[], root = process.cwd()): string[] {
	const list = Array.isArray(components) ? components : [components];
	return list.map((entry) => {
		let path = entry.replaceAll("\\", "/");
		const alias = /^([a-z][\w-]*):/i.exec(path)?.[1];
		if (alias) {
			if (alias !== "npm") throw new Error(`Unknown WebC alias "${alias}" in components entry "${entry}". Known aliases: npm.`);
			path = posix.join("node_modules", path.slice(alias.length + 1));
		}
		path = path.replace(/^\.\//, "");
		if (!isGlob(path) && !path.endsWith(".webc") && isDirectory(posix.join(root.replaceAll("\\", "/"), path))) return posix.join(path, "**/*.webc");
		return path;
	});
}

function isDirectory(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}
