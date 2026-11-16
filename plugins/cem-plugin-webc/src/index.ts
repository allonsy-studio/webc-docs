/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import pkgJson from "../package.json" with { type: "json" };

/** Package version, read from `package.json`. */
export const VERSION = pkgJson.version;
