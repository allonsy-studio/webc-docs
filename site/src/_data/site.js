/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import path from "node:path";
import { buildSite } from "@allons-y/webc-patterns/project";
import { host } from "@allons-y/webc-oss-site";

/** Site facts from the repository's root package.json. */
export default () =>
	buildSite({
		packagePath: path.resolve(import.meta.dirname, "../../../package.json"),
		projectPath: path.resolve(import.meta.dirname, "project.json"),
		host,
	});
