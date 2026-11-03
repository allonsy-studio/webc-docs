/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { Reference } from "@allons-y/webcdoc-schema";
import type { ComponentRule } from "./rule.js";

const label = (ref: Reference): string => ref.path ?? ref.name ?? "";
const toIssues = (refs: Reference[], message: (name: string) => string) =>
	refs.map((ref) => ({ message: message(label(ref)), line: ref.line }));

/** Flags reads of page data (`.*`), which the host must supply. */
export const noGlobalData: ComponentRule = {
	name: "no-global-data",
	description: "Flags reads of page data under $data, which the host must supply.",
	defaultSeverity: "warn",
	scope: "component",
	check: (record) => toIssues(record.webc.references.data, (name) => `Reads page data "$data.${name}", so the component needs the host to provide it.`),
};

/** Flags calls to known helpers, which the host must register. */
export const noUndeclaredHelper: ComponentRule = {
	name: "no-undeclared-helper",
	description: "Flags calls to helper functions, which the host must register.",
	defaultSeverity: "warn",
	scope: "component",
	check: (record) => toIssues(record.webc.references.helpers, (name) => `Calls helper "${name}", which the host must register.`),
};

/** Flags identifiers that resolve to no prop, setup export, loop variable, or helper. */
export const noUnresolved: ComponentRule = {
	name: "no-unresolved",
	description: "Flags identifiers read in the template or setup that resolve to nothing in the component.",
	defaultSeverity: "warn",
	scope: "component",
	check: (record) => toIssues(record.webc.references.unresolved, (name) => `"${name}" is read but is not a prop, setup export, loop variable, or helper.`),
};
