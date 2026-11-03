/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/** Options for the plugin. */
export interface WebcdocPluginOptions {
	/** Component globs and `npm:` aliases, in the shape `eleventy-plugin-webc` takes. Read from that plugin when omitted. */
	components?: string | string[];
	/** Extra helper names to treat as provided by the host. */
	helpers?: string[];
	/** File written into the output directory on `eleventy.after`, or `false` to write nothing. */
	output?: string | false;
	/** Global data key that holds the document. */
	globalData?: string;
	/** Compile each `@example` through WebC and store the result on `examples[].html`. */
	renderExamples?: boolean;
	/** Check `$data` paths against the global data and warn on misses. */
	warnOnMissingData?: boolean;
}

export interface ResolvedOptions {
	components: string | string[] | undefined;
	helpers: string[];
	output: string | false;
	globalData: string;
	renderExamples: boolean;
	warnOnMissingData: boolean;
}

/** The slice of Eleventy's user config this plugin touches. */
export interface EleventyConfigLike {
	plugins?: { plugin: unknown; options?: Record<string, unknown> }[];
	javascript?: { functions?: Record<string, unknown> };
	globalData?: Record<string, unknown>;
	getFilters?: () => Record<string, unknown>;
	addGlobalData(name: string, data: unknown): unknown;
	on(event: string, handler: (arg: never) => unknown): unknown;
}

/** The slice of Eleventy's template config used to read global data. */
export interface TemplateConfigLike {
	getConfig(): { globalData?: Record<string, unknown> };
}

/** Argument Eleventy passes to `eleventy.before` and `eleventy.after`. */
export interface BuildEvent {
	directories: { input: string; output: string; data?: string };
	outputMode?: string;
	runMode?: string;
}
