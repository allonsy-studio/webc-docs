/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Eleventy from "@11ty/eleventy";
import webcPlugin from "@11ty/eleventy-plugin-webc";
import type { WebcdocDocument } from "@allons-y/webcdoc";
import webcdocPlugin, { type WebcdocPluginOptions } from "../src/index.js";
import type { EleventyConfigLike } from "../src/types.js";

/** The Eleventy config calls the tests make. */
export interface ConfigApi extends EleventyConfigLike {
	addFilter(name: string, fn: (...args: never[]) => unknown): void;
	addPlugin(plugin: unknown, options?: unknown): void;
}

export const SITE = "test/fixtures/site";

interface Run {
	doc: WebcdocDocument;
	/** Files written to the output directory, sorted. */
	files: string[];
	/** Rendered fixture home page. */
	page: string;
}

export interface RunOptions {
	plugin?: WebcdocPluginOptions;
	/** Options for eleventy-plugin-webc; `false` leaves that plugin out. */
	webc?: Record<string, unknown> | false;
	configure?: (eleventyConfig: ConfigApi) => void;
}

/** Builds the fixture project programmatically and reads back the written document. */
export async function build(options: RunOptions = {}): Promise<Run> {
	const output = await mkdtemp(join(tmpdir(), "webcdoc-"));
	try {
		const elev = new Eleventy(SITE, output, {
			quietMode: true,
			config(eleventyConfig: ConfigApi) {
				eleventyConfig.addFilter("shout", (value: string) => value.toUpperCase());
				eleventyConfig.addGlobalData("flag", true);
				if (options.webc !== false) eleventyConfig.addPlugin(webcPlugin, options.webc ?? { components: `${SITE}/_components/*.webc` });
				eleventyConfig.addPlugin(webcdocPlugin, options.plugin ?? {});
				options.configure?.(eleventyConfig);
			},
		});
		await elev.write();
		const files = (await readdir(output, { recursive: true })).sort();
		const file = options.plugin?.output === false ? undefined : join(output, options.plugin?.output || "webcdoc.json");
		const doc = file ? (JSON.parse(await readFile(file, "utf8")) as WebcdocDocument) : (undefined as never);
		const page = await readFile(join(output, "index.html"), "utf8");
		return { doc, files, page };
	} finally {
		await rm(output, { recursive: true, force: true });
	}
}
