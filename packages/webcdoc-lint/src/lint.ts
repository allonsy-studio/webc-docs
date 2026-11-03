/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { WebcdocDocument } from "@allons-y/webcdoc-schema";
import { parseConfig } from "./config.js";
import { ruleNames, rules, type RuleName } from "./rules/index.js";
import type { Finding, Issue, LintConfig, LintResult, RuleSetting, Severity } from "./types.js";

/** Effective setting for every rule: each rule's default, overlaid with the config's overrides. Throws on a bad config. */
export function resolveSettings(config: LintConfig = {}): Record<RuleName, RuleSetting> {
	const checked = parseConfig(config, "lint config");
	const settings = {} as Record<RuleName, RuleSetting>;
	for (const name of ruleNames) settings[name] = checked.rules?.[name] ?? rules[name].defaultSeverity;
	return settings;
}

/** Runs every rule that is not `off`. Component rules run per component in document order; package rules run last. */
export function lint(doc: WebcdocDocument, config: LintConfig = {}): LintResult {
	const settings = resolveSettings(config);
	const findings: Finding[] = [];
	const push = (name: RuleName, issues: Issue[], location: { path: string; tagName?: string }): void => {
		const severity = settings[name] as Severity;
		for (const issue of issues) {
			const finding: Finding = { rule: name, severity, path: issue.path ?? location.path, message: issue.message };
			if (location.tagName !== undefined) finding.tagName = location.tagName;
			if (issue.line !== undefined) finding.line = issue.line;
			findings.push(finding);
		}
	};

	for (const record of doc.components) {
		for (const name of ruleNames) {
			const rule = rules[name];
			if (rule.scope === "component" && settings[name] !== "off") {
				push(name, rule.check(record, doc), { path: record.path, tagName: record.tagName });
			}
		}
	}
	for (const name of ruleNames) {
		const rule = rules[name];
		if (rule.scope === "package" && settings[name] !== "off") push(name, rule.check(doc), { path: "" });
	}
	return { findings };
}
