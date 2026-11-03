/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/** Uses forward slashes, drops leading `./`, and collapses repeated slashes, so two spellings of one path compare equal. */
export const normalizePath = (path: string): string =>
	path
		.replaceAll("\\", "/")
		.replace(/\/{2,}/g, "/")
		.replace(/^(?:\.\/)+/, "");
