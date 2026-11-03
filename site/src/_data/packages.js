/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const REPO = "https://github.com/allonsy-studio/webc-docs";

/** The packages and plugins this repository ships, in the order the site lists them. */
const SHIPPED = [
	{ dir: "packages/webcdoc-schema" },
	{ dir: "packages/webcdoc" },
	{ dir: "packages/webcdoc-tools" },
	{ dir: "packages/webcdoc-lint" },
	{ dir: "plugins/eleventy-plugin-webcdoc", recommended: true },
	{ dir: "plugins/cem-plugin-webc", summary: "Custom Elements Manifest analyzer plugin that reads .webc files, for projects already running the analyzer." },
];

const md = new MarkdownIt({ html: true });

/** The README without its title and its studio footer: the page has its own heading and footer. */
const bodyOf = (readme) => readme.replace(/^# .*\n+/, "").replace(/\n---\n\n<sub>[\s\S]*$/, "\n");

/** The first sentence of the first paragraph, as plain text. */
const ledeOf = (body) =>
	body
		.trim()
		.split(/\n\s*\n/)[0]
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/`/g, "")
		.replace(/\s+/g, " ")
		.split(/(?<=\.)\s/)[0]
		.replace(/\.$/, "");

/** A link in a README is relative to its package folder: point it at the same place on GitHub. */
function repoHref(dir, href) {
	if (/^(https?:|mailto:|#)/.test(href)) return href;
	const [file, hash = ""] = href.split("#");
	const target = path.posix.normalize(path.posix.join(dir, file));
	const isDir = fs.existsSync(path.join(ROOT, target)) && fs.statSync(path.join(ROOT, target)).isDirectory();
	return `${REPO}/${isDir ? "tree" : "blob"}/main/${target}${hash ? `#${hash}` : ""}`;
}

export default SHIPPED.map((entry, index) => {
	const readme = fs.readFileSync(path.join(ROOT, entry.dir, "README.md"), "utf8");
	const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, entry.dir, "package.json"), "utf8"));
	const body = bodyOf(readme);
	const slug = pkg.name.split("/").pop();
	const html = md.render(body).replace(/href="([^"]+)"/g, (_, href) => `href="${repoHref(entry.dir, href)}"`);
	return {
		order: index + 1,
		slug,
		name: pkg.name,
		version: pkg.version,
		description: entry.summary ?? ledeOf(body),
		recommended: entry.recommended === true,
		url: `/packages/${slug}/`,
		npm: `https://www.npmjs.com/package/${pkg.name}`,
		github: `${REPO}/tree/main/${entry.dir}`,
		html,
	};
});
