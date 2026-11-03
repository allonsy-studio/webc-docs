/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/** Eleventy configuration for the webcdoc docs site. */
export default function () {
	return {
		dir: { input: "src", output: "_site" },
		pathPrefix: process.env.PATH_PREFIX ?? "/",
	};
}
