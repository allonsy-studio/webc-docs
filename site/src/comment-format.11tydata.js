/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import fs from "node:fs";
import path from "node:path";

const SKIP_LINK = path.resolve(import.meta.dirname, "../_components/skip-link.webc");

export default {
	eleventyComputed: {
		skipLinkSource: () => fs.readFileSync(SKIP_LINK, "utf8"),
		skipLinkRecord: (data) => JSON.stringify(data.webcdoc?.components?.find((component) => component.tagName === "skip-link") ?? null, null, 2),
	},
};
