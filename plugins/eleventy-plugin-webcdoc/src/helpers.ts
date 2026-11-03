/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { EleventyConfigLike } from "./types.js";

/**
 * Names the host provides to templates: the JavaScript functions Eleventy hands to WebC as helpers
 * (filters and shortcodes combined), the universal filters, and any names the user lists.
 */
export function collectHelpers(config: EleventyConfigLike, extra: string[] = []): string[] {
	const names = new Set<string>(extra);
	for (const name of Object.keys(config.javascript?.functions ?? {})) names.add(name);
	if (typeof config.getFilters === "function") for (const name of Object.keys(config.getFilters())) names.add(name);
	return [...names].sort();
}
