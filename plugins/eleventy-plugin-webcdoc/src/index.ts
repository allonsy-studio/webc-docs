/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { WebcdocDocument } from "@allons-y/webcdoc";
import { expandComponents } from "./components.js";
import { loadGlobalData } from "./data.js";
import { generateDocument } from "./generate.js";
import { collectHelpers } from "./helpers.js";
import { DEFAULT_COMPONENTS, resolveOptions } from "./options.js";
import type { BuildEvent, EleventyConfigLike, TemplateConfigLike, WebcdocPluginOptions } from "./types.js";
import { findWebcComponents } from "./webc-options.js";

export { expandComponents } from "./components.js";
export { hasPath } from "./data.js";
export { VERSION } from "./generate.js";
export { collectHelpers } from "./helpers.js";
export { DEFAULT_COMPONENTS, resolveOptions, sharedWebcOptions } from "./options.js";
export { findWebcComponents } from "./webc-options.js";
export type { WebcdocPluginOptions } from "./types.js";

/**
 * Eleventy plugin that builds the webcdoc document with the host's helpers and global data in view.
 * Exposes the document as global data and writes it to the output directory.
 */
export default function webcdocPlugin(eleventyConfig: EleventyConfigLike, userOptions: WebcdocPluginOptions = {}): void {
	const options = resolveOptions(userOptions);
	const components = options.components ?? findWebcComponents(eleventyConfig) ?? DEFAULT_COMPONENTS;
	const globs = expandComponents(components);

	let templateConfig: TemplateConfigLike | undefined;
	let extensionMap: unknown;
	let current: Promise<WebcdocResult> = Promise.reject(new Error("webcdoc: the document is built when Eleventy starts a build."));
	current.catch(() => {});

	eleventyConfig.on("eleventy.config", ((cfg: TemplateConfigLike) => {
		templateConfig = cfg;
	}) as never);
	eleventyConfig.on("eleventy.extensionmap", ((map: unknown) => {
		extensionMap = map;
	}) as never);

	eleventyConfig.on("eleventy.before", (async () => {
		const loaded = await loadGlobalData(templateConfig, extensionMap, options.globalData);
		const check = options.warnOnMissingData && loaded.complete;
		if (options.warnOnMissingData && !loaded.complete) console.warn("[webcdoc] Global data could not be read, so $data paths were not checked.");
		current = generateDocument({
			globs,
			helpers: collectHelpers(eleventyConfig, options.helpers),
			data: loaded.data,
			checkData: check,
			functions: eleventyConfig.javascript?.functions,
			renderExamples: options.renderExamples,
			log: (message) => console.warn(`[webcdoc] ${message}`),
		}).then((document) => ({ document }));
		current.catch(() => {});
		await current;
	}) as never);

	eleventyConfig.addGlobalData(options.globalData, async () => (await current).document);

	eleventyConfig.on("eleventy.after", (async (event: BuildEvent) => {
		if (options.output === false || event.outputMode !== "fs") return;
		const { document } = await current;
		const file = join(event.directories.output, options.output);
		await mkdir(join(file, ".."), { recursive: true });
		await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
	}) as never);
}

interface WebcdocResult {
	document: WebcdocDocument;
}
