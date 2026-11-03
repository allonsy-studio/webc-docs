/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { DEFAULT_COMPONENTS } from "./options.js";
import type { EleventyConfigLike } from "./types.js";

const PACKAGE = "@11ty/eleventy-plugin-webc";

/** True when a registered plugin is `@11ty/eleventy-plugin-webc`; matched by package name or by the options its function reads. */
function isWebcPlugin(plugin: unknown): boolean {
	const named = plugin as { eleventyPackage?: string; configFunction?: unknown } | undefined;
	if (named?.eleventyPackage === PACKAGE) return true;
	const fn = typeof plugin === "function" ? plugin : named?.configFunction;
	if (typeof fn !== "function") return false;
	const source = Function.prototype.toString.call(fn);
	return source.includes("scopedHelpers") && source.includes("useTransform");
}

/**
 * Reads the `components` value the user gave `eleventy-plugin-webc`.
 * Returns undefined when that plugin is not registered.
 */
export function findWebcComponents(config: EleventyConfigLike): string | string[] | undefined {
	const entry = config.plugins?.find((e) => isWebcPlugin(e.plugin));
	if (!entry) return undefined;
	const components = entry.options?.components;
	return (components as string | string[] | undefined) ?? DEFAULT_COMPONENTS;
}
