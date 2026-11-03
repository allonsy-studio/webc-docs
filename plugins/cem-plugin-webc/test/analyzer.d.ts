/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { Package } from "custom-elements-manifest/schema";
import type TypeScript from "typescript";

/**
 * The analyzer's own index.d.ts leaves out the `create` and `ts` exports its
 * index.js provides. This augmentation adds the two the tests call.
 */
declare module "@custom-elements-manifest/analyzer" {
	export const ts: typeof TypeScript;
	export function create(options: {
		modules: TypeScript.SourceFile[];
		plugins?: unknown[];
		context?: Record<string, unknown>;
	}): Package;
}
