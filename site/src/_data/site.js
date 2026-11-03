/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import fs from "node:fs";
import path from "node:path";
import { buildSite } from "@allons-y/webc-patterns/project";
import { host } from "@allons-y/webc-oss-site";

const ROOT = path.resolve(import.meta.dirname, "../../..");

/** Site facts from the repository's root package.json. Footer links only point at files the repository has. */
export default () => {
	const site = buildSite({
		packagePath: path.join(ROOT, "package.json"),
		projectPath: path.join(import.meta.dirname, "project.json"),
		host,
	});
	const has = (file) => fs.existsSync(path.join(ROOT, file));
	return {
		...site,
		contributingUrl: has(".github/CONTRIBUTING.md") ? site.contributingUrl : null,
		changelogUrl: has("CHANGELOG.md") ? site.changelogUrl : null,
	};
};
