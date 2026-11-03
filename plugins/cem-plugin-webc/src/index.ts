/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

export { webcModuleCreation } from "./module-creation.js";
export type { WebcModuleCreationOptions } from "./module-creation.js";
export { webcPlugin, mergeRecord } from "./plugin.js";
export type { AnalyzerPlugin, WebcPluginOptions } from "./plugin.js";
export { extractClientScripts, virtualSource } from "./virtual.js";

/** Package version, kept in step with package.json. */
export const VERSION = "0.1.0-beta.0";
