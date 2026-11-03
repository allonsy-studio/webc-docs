/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord, WebcdocDocument } from "@allons-y/webcdoc-schema";
import { normalizePath } from "./paths.js";

/** Finds the first component with the given tag name. */
export const getComponent = (doc: WebcdocDocument, tagName: string): ComponentRecord | undefined =>
	doc.components.find((c) => c.tagName === tagName);

/** Finds the first component whose path matches, ignoring `./` and slash spelling. */
export const getComponentByPath = (doc: WebcdocDocument, path: string): ComponentRecord | undefined => {
	const wanted = normalizePath(path);
	return doc.components.find((c) => normalizePath(c.path) === wanted);
};

/** Lists each tag name once, in document order. */
export const listTagNames = (doc: WebcdocDocument): string[] => [...new Set(doc.components.map((c) => c.tagName))];
