/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

export { validate } from "./validate.js";
export { lint, resolveSettings } from "./lint.js";
export { ConfigError, loadConfig, parseConfig } from "./config.js";
export { rules, ruleNames } from "./rules/index.js";
export type { ComponentRule, PackageRule, Rule, RuleName } from "./rules/index.js";
export type { Finding, Issue, LintConfig, LintResult, RuleSetting, Severity, ValidationError, ValidationResult } from "./types.js";
