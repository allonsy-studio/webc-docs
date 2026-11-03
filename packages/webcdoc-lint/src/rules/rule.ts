/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord, WebcdocDocument } from "@allons-y/webcdoc-schema";
import type { Issue, Severity } from "../types.js";

interface RuleBase {
	/** Kebab-case name used in config and output. */
	name: string;
	description: string;
	defaultSeverity: Severity;
}

/** A rule that inspects one component at a time. */
export interface ComponentRule extends RuleBase {
	scope: "component";
	check(record: ComponentRecord, doc: WebcdocDocument): Issue[];
}

/** A rule that inspects the whole document once. */
export interface PackageRule extends RuleBase {
	scope: "package";
	check(doc: WebcdocDocument): Issue[];
}

export type Rule = ComponentRule | PackageRule;

/** A warning code the parser (or a host plugin) attached to a record, typed loosely so new codes work. */
export interface CodedWarning {
	code: string;
	message: string;
	line: number;
}

/** Issues for every warning on a record with the given code. */
export const issuesForCode = (record: ComponentRecord, code: string): Issue[] =>
	(record.warnings as CodedWarning[])
		.filter((w) => w.code === code)
		.map((w) => ({ message: w.message, line: w.line }));
