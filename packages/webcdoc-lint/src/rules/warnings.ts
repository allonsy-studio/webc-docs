/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { issuesForCode, type ComponentRule, type PackageRule } from "./rule.js";

/** Builds a component rule that reports every parser warning with one code. */
const fromWarningCode = (name: string, code: string, description: string): ComponentRule => ({
	name,
	description,
	defaultSeverity: "warn",
	scope: "component",
	check: (record) => issuesForCode(record, code),
});

/** Flags `<!-- -->` comments, which ship to the built output. */
export const noRegularComments = fromWarningCode(
	"no-regular-comments",
	"regular-comment",
	"Flags regular HTML comments, which ship to the built output.",
);

/** Flags template expressions that read a prop nobody documented. */
export const requirePropDocs = fromWarningCode(
	"require-prop-docs",
	"prop-undocumented",
	"Flags identifiers read in the template that no documented prop, setup export, or helper explains.",
);

/** Flags default slots with fallback content, which render only when the host has no child nodes. */
export const noDefaultSlotFallback = fromWarningCode(
	"no-default-slot-fallback",
	"default-slot-fallback",
	"Flags a default slot with fallback content, which renders only when the host is empty.",
);

/** Flags `$data` paths that the Eleventy plugin could not find in the global data. */
export const noMissingData = fromWarningCode(
	"no-missing-data",
	"data-missing",
	"Flags $data paths the Eleventy plugin could not find in the global data. Raised by @allons-y/eleventy-plugin-webcdoc.",
);

/** Flags `webc:import` paths the Eleventy plugin could not resolve. */
export const noMissingImport = fromWarningCode(
	"no-missing-import",
	"import-missing",
	"Flags webc:import paths that do not resolve to a file. Raised by @allons-y/eleventy-plugin-webcdoc.",
);

/** Flags a tag name that two or more files define. */
export const noDuplicateTag: PackageRule = {
	name: "no-duplicate-tag",
	description: "Flags a tag name that two or more files define.",
	defaultSeverity: "error",
	scope: "package",
	check: (doc) =>
		doc.warnings
			.filter((w) => w.code === "duplicate-tag")
			.map((w) => ({ message: `${w.message} Paths: ${w.paths.join(", ")}`, path: w.paths[0] })),
};
