/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { Validator } from "@cfworker/json-schema";
import schema from "@allons-y/webcdoc-schema/schema.json" with { type: "json" };
import type { ValidationError, ValidationResult } from "./types.js";

/** Validator built once: draft 2020-12, every error reported rather than the first. */
const validator = new Validator(schema as Record<string, unknown>, "2020-12", false);

/**
 * Checks a webcdoc document against the published JSON Schema.
 * The document is compared as JSON, so `undefined` fields are dropped first.
 */
export function validate(doc: unknown): ValidationResult {
	let json: unknown;
	try {
		json = JSON.parse(JSON.stringify(doc));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { valid: false, errors: [{ path: "", message: `Document is not JSON: ${message}` }] };
	}
	if (json === null || typeof json !== "object" || Array.isArray(json)) {
		return { valid: false, errors: [{ path: "", message: "Document must be an object" }] };
	}
	const result = validator.validate(json);
	const errors: ValidationError[] = result.errors.map((e) => ({
		path: e.instanceLocation.replace(/^#/, ""),
		message: e.error,
	}));
	return { valid: result.valid, errors };
}
