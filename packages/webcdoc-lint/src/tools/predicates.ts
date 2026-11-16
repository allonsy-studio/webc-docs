/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord, WarningCode } from "@allons-y/webcdoc-schema";

/** True when the record has a summary, a description, or a documented prop or slot. */
export const isDocumented = (record: ComponentRecord): boolean =>
	record.summary !== "" ||
	record.description !== "" ||
	record.props.some((p) => p.description !== "") ||
	record.slots.some((s) => s.description !== "");

/** True when the component has a client script that may define a custom element. */
export const hasClientScript = (record: ComponentRecord): boolean => record.webc.clientScript;

/** True when WebC keeps the host tag in the output. */
export const rendersHostTag = (record: ComponentRecord): boolean => record.webc.host.rendered;

/** True when the component reads nothing the host must supply: no data paths, helpers, or unresolved names. */
export const isPortable = (record: ComponentRecord): boolean => {
	const { data, helpers, unresolved } = record.webc.references;
	return data.length === 0 && helpers.length === 0 && unresolved.length === 0;
};

/** True when the component raised a warning with the given code. */
export const hasWarning = (record: ComponentRecord, code: WarningCode): boolean =>
	record.warnings.some((w) => w.code === code);

/** True when the component is marked deprecated, with or without a reason. */
export const isDeprecated = (record: ComponentRecord): boolean =>
	record.deprecated === true || (typeof record.deprecated === "string" && record.deprecated !== "");
