/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { TemplateConfigLike } from "./types.js";

type Data = Record<string, unknown>;

export interface LoadedData {
	data: Data;
	/** False when part of the cascade could not be read, so absence proves nothing. */
	complete: boolean;
}

/** Roots Eleventy fills in per page or at build time, so they are never missing. */
const BUILT_IN_ROOTS = new Set(["page", "eleventy", "collections", "pkg"]);

const isObject = (v: unknown): v is Data => typeof v === "object" && v !== null && !Array.isArray(v);

function setPath(target: Data, path: string, value: unknown): void {
	const keys = path.split(".");
	let node = target;
	for (const key of keys.slice(0, -1)) {
		if (!isObject(node[key])) node[key] = {};
		node = node[key] as Data;
	}
	node[keys.at(-1)!] = value;
}

function merge(base: Data, over: Data): Data {
	const out: Data = { ...base };
	for (const [key, value] of Object.entries(over)) out[key] = isObject(out[key]) && isObject(value) ? merge(out[key] as Data, value) : value;
	return out;
}

/** True when `a.b.c` exists in the data; a function value is treated as opaque, so anything below it counts as present. */
export function hasPath(data: Data, path: string): boolean {
	const [root = ""] = path.split(".");
	if (BUILT_IN_ROOTS.has(root)) return true;
	let node: unknown = data;
	for (const key of path.split(".")) {
		if (typeof node === "function") return true;
		if (node === null || typeof node !== "object" || !(key in node)) return false;
		node = (node as Data)[key];
	}
	return true;
}

/** Values added with `addGlobalData`, minus the key this plugin owns. Functions are awaited as Eleventy does. */
async function readConfigData(templateConfig: TemplateConfigLike, skip: string): Promise<Data> {
	const source = templateConfig.getConfig().globalData ?? {};
	const out: Data = {};
	for (const key of Object.keys(source)) {
		if (key === skip) continue;
		const value = source[key];
		setPath(out, key, typeof value === "function" ? await (value as () => unknown)() : value);
	}
	return out;
}

interface TemplateDataLike {
	setProjectUsingEsm(esm: boolean): void;
	setFileSystemSearch(search: unknown): void;
	extensionMap: unknown;
	getAllGlobalData(): Promise<Data>;
}

/**
 * Reads the project's `_data` files through Eleventy's own TemplateData, which is not a public export,
 * so it is imported by path next to the entry point Eleventy resolves to.
 */
async function readDataFiles(templateConfig: TemplateConfigLike, extensionMap: unknown): Promise<Data> {
	const entry = import.meta.resolve("@11ty/eleventy");
	const [{ default: TemplateData }, { default: FileSystemSearch }] = await Promise.all([
		import(new URL("./Data/TemplateData.js", entry).href),
		import(new URL("./FileSystemSearch.js", entry).href),
	]);
	const templateData = new TemplateData(templateConfig) as TemplateDataLike;
	templateData.setProjectUsingEsm(true);
	templateData.extensionMap = extensionMap;
	templateData.setFileSystemSearch(new FileSystemSearch());
	return templateData.getAllGlobalData();
}

/** Global data as templates will see it: `_data` files overlaid by `addGlobalData` values. */
export async function loadGlobalData(templateConfig: TemplateConfigLike | undefined, extensionMap: unknown, skip: string): Promise<LoadedData> {
	if (!templateConfig) return { data: {}, complete: false };
	const fromConfig = await readConfigData(templateConfig, skip);
	try {
		const fromFiles = await readDataFiles(templateConfig, extensionMap);
		return { data: merge(fromFiles, fromConfig), complete: true };
	} catch {
		return { data: fromConfig, complete: false };
	}
}
