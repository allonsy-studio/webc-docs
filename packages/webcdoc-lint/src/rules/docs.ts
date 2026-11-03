/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRule } from "./rule.js";

/** Requires a one-line `@summary` on every component. */
export const requireSummary: ComponentRule = {
	name: "require-summary",
	description: "Requires a one-line @summary on every component.",
	defaultSeverity: "warn",
	scope: "component",
	check: (record) => (record.summary === "" ? [{ message: "Component has no @summary." }] : []),
};
