/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { parseBlock } from "../src/blocks.js";
import { TAGS, camelCase, isKnownTag, toCss, toExample, toProp } from "../src/tags.js";

const tag = (text: string) => parseBlock(`/** ${text} */`).tags[0]!;

describe("tag table", () => {
	it("lists every known tag with a field", () => {
		expect(Object.keys(TAGS).sort()).toEqual(
			["attr", "cssprop", "csspart", "cssstate", "demo", "deprecated", "example", "fires", "prop", "since", "slot", "summary", "tag"].sort(),
		);
		expect(isKnownTag("prop")).toBe(true);
		expect(isKnownTag("author")).toBe(false);
	});
});

describe("items", () => {
	it("camelCases the property and keeps the authored attribute", () => {
		expect(camelCase("icon-only")).toBe("iconOnly");
		expect(toProp(tag("@prop {boolean} [icon-only=false] - Hide label."))).toMatchObject({
			name: "icon-only",
			attribute: "@icon-only",
			property: "iconOnly",
			default: "false",
			optional: true,
		});
		expect(toProp(tag("@prop :@items - Rows."))).toMatchObject({ name: "items", attribute: ":@items" });
	});

	it("maps css properties", () => {
		expect(toCss(tag("@cssprop {<color>} [--x=red] - Fill."))).toMatchObject({ name: "--x", syntax: "<color>", default: "red" });
	});

	it("splits example title from code", () => {
		expect(toExample("Custom\n<a></a>\n")).toEqual({ title: "Custom", code: "<a></a>" });
		expect(toExample("\n<a></a>")).toEqual({ title: "", code: "<a></a>" });
	});
});
