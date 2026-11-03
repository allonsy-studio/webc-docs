/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ResolvedOptions, WebcdocPluginOptions } from "./types.js";

/** Component glob `eleventy-plugin-webc` uses when none is given. */
export const DEFAULT_COMPONENTS = "_components/**/*.webc";

/** Fills defaults. `components` stays undefined until the webc plugin has been consulted. */
export function resolveOptions(options: WebcdocPluginOptions = {}): ResolvedOptions {
	return {
		components: options.components,
		helpers: options.helpers ?? [],
		output: options.output ?? "webcdoc.json",
		globalData: options.globalData ?? "webcdoc",
		renderExamples: options.renderExamples ?? false,
		warnOnMissingData: options.warnOnMissingData ?? true,
	};
}

/** Options to spread into both plugins so the component set is written once. */
export const sharedWebcOptions = <T extends Record<string, unknown>>(components: string | string[], extra?: T) => ({ components, ...extra });
