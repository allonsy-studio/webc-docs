/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "@allons-y/webcdoc";
import type { ComponentRecord } from "@allons-y/webcdoc";

const sources = new Map<string, string>();
const records = new Map<string, { source: string; helpers: string; record: ComponentRecord }>();

/** Absolute path used as the cache key. */
export const keyFor = (cwd: string, path: string): string => resolve(cwd, path);

/** Reads a .webc file and remembers its text for the link phase. */
export function readSource(cwd: string, path: string): string {
	const source = readFileSync(keyFor(cwd, path), "utf8");
	sources.set(keyFor(cwd, path), source);
	return source;
}

/** Parses a .webc file once per distinct text; the analyzer's hooks are synchronous, so this uses `parse`. */
export function recordFor(cwd: string, path: string, helpers?: string[]): ComponentRecord {
	const key = keyFor(cwd, path);
	const source = sources.get(key) ?? readSource(cwd, path);
	const sig = (helpers ?? []).join(",");
	const hit = records.get(key);
	if (hit && hit.source === source && hit.helpers === sig) return hit.record;
	const record = parse(source, { path, ...(helpers ? { helpers } : {}) });
	records.set(key, { source, helpers: sig, record });
	return record;
}
