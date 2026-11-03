/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { noDuplicateTag, noDefaultSlotFallback, noMissingData, noMissingImport, noRegularComments, requirePropDocs } from "./warnings.js";
import { noGlobalData, noUndeclaredHelper, noUnresolved } from "./references.js";
import { requireSummary } from "./docs.js";
import { noDeprecatedUse } from "./uses.js";
import type { Rule } from "./rule.js";

export type { ComponentRule, PackageRule, Rule } from "./rule.js";

/** Every rule, keyed by name. Config keys and output names come from here. */
export const rules = {
	"no-global-data": noGlobalData,
	"no-undeclared-helper": noUndeclaredHelper,
	"no-unresolved": noUnresolved,
	"no-regular-comments": noRegularComments,
	"require-summary": requireSummary,
	"require-prop-docs": requirePropDocs,
	"no-default-slot-fallback": noDefaultSlotFallback,
	"no-missing-data": noMissingData,
	"no-missing-import": noMissingImport,
	"no-duplicate-tag": noDuplicateTag,
	"no-deprecated-use": noDeprecatedUse,
} satisfies Record<string, Rule>;

export type RuleName = keyof typeof rules;

/** Rule names in table order. */
export const ruleNames = Object.keys(rules) as RuleName[];
