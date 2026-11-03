/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { HtmlBasePlugin } from "@11ty/eleventy";
import { fillHooks } from "@allons-y/webc-patterns/plugin";
import oss, { ossProps } from "@allons-y/webc-oss-site";
import { patterns } from "@allons-y/webc-patterns";
import webcdocPlugin from "@allons-y/eleventy-plugin-webcdoc";
import dashly from "@allons-y/dashly";

/** Docs pages in sidebar order: the components index, each component, then the plugins page. */
const DOCS_RANK = (page) => {
	if (page.inputPath.endsWith("components/index.webc")) return 0;
	if (page.inputPath.includes("/components/")) return 1;
	return 2;
};

/** Sidebar entries for the docs layout. */
const docsOf = (data) =>
	(data.collections?.docs ?? []).map((page) => ({
		href: page.url,
		title: page.data.title,
		description: page.data.description,
	}));

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(oss, {
		props: (data) => ({
			...ossProps(data.site, data.project, { docs: docsOf(data), anchors: data.anchors === true }),
			title: data.title,
			description: data.description ?? data.site?.description,
			docs: docsOf(data),
		}),
	});
	fillHooks(eleventyConfig, {
		head: '<link rel="stylesheet" href="/assets/styles/site.css" webc:keep />',
	});
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(dashly, { transforms: false });
	eleventyConfig.addPassthroughCopy({ "src/styles/site.css": "assets/styles/site.css" });

	eleventyConfig.addCollection("docs", (api) =>
		api
			.getFilteredByGlob(["src/components/**/*.webc", "src/plugins.md"])
			.sort((a, b) => DOCS_RANK(a) - DOCS_RANK(b) || a.url.localeCompare(b.url)),
	);

	eleventyConfig.addPlugin(webcdocPlugin, {
		components: [patterns()],
	});

	return {
		dir: { input: "src", output: "_site" },
		pathPrefix: process.env.PATH_PREFIX ?? "/",
		markdownTemplateEngine: false,
	};
}
