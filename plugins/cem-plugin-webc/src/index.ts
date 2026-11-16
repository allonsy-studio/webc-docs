/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { createRequire } from "node:module";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

/** Package version, read from `package.json`. */
export const VERSION = version;
