/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/** How serious a finding is. Only `error` makes the CLI exit 1. */
export type Severity = "error" | "warn";

/** What the config may set a rule to. `off` skips the rule. */
export type RuleSetting = Severity | "off";

/** One problem a rule found. */
export interface Finding {
	rule: string;
	severity: Severity;
	/** Tag name of the component, absent for package-level findings. */
	tagName?: string;
	/** Path of the component file, or of the first file for a package-level finding. */
	path: string;
	line?: number;
	message: string;
}

/** One problem a rule reports before it gets its rule name and severity. */
export interface Issue {
	message: string;
	line?: number;
	/** Overrides the component path, for findings that point at another file. */
	path?: string;
}

/** A schema violation, with a JSON Pointer to the value that broke it. */
export interface ValidationError {
	path: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

/** Rule settings keyed by rule name. Rules left out keep their default. */
export interface LintConfig {
	rules?: Partial<Record<string, RuleSetting>>;
}

export interface LintResult {
	findings: Finding[];
}
