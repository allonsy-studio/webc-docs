/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/** A data function: Eleventy hands it the config-level global data, which includes every addGlobalData value. */
export default function (data) {
	return { keys: Object.keys(data).length };
}
