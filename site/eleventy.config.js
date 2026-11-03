/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import path from "node:path";

import { HtmlBasePlugin } from "@11ty/eleventy";
import { fillHooks } from "@allons-y/webc-patterns/plugin";
import oss, { ossProps } from "@allons-y/webc-oss-site";
import webcdocPlugin from "@allons-y/eleventy-plugin-webcdoc";
import dashly from "@allons-y/dashly";

/** Sidebar entries for the docs layout, in their `order`. */
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
			packages: (data.packages ?? []).map((pkg) => ({ title: pkg.name, description: pkg.description, href: pkg.url })),
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
			.getFilteredByGlob(["src/packages/**/*.webc", "src/comment-format.webc"])
			.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0)),
	);

	eleventyConfig.addPlugin(webcdocPlugin, {
		components: [path.join(import.meta.dirname, "_components", "**", "*.webc")],
	});

	return {
		dir: { input: "src", output: "_site" },
		pathPrefix: process.env.PATH_PREFIX ?? "/",
		markdownTemplateEngine: false,
	};
}
