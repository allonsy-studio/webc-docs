/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

export default {
	permalink: (data) => (data.pkg ? `packages/${data.pkg.slug}/index.html` : true),
	eleventyComputed: {
		title: (data) => data.pkg?.name,
		description: (data) => data.pkg?.description,
		order: (data) => data.pkg?.order,
	},
};
