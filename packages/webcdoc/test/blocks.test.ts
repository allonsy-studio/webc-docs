/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { findJsdoc, parseBlock } from "../src/blocks.js";

describe("parseBlock", () => {
	it("reads a server comment body and keeps real line numbers", () => {
		const b = parseBlock("-\nIntro text.\n\n@prop {string} [label=Skip to content] - Visible text.\n@slot - Default.\n-", 10);
		expect(b.description).toBe("Intro text.");
		expect(b.tags[0]).toMatchObject({ tag: "prop", name: "label", type: "string", optional: true, default: "Skip to content", description: "Visible text.", line: 13 });
		expect(b.tags[1]).toMatchObject({ tag: "slot", name: "", description: "Default.", line: 14 });
	});

	it("gives the same output for a JSDoc carrier", () => {
		const a = parseBlock("- @csspart link - The anchor. -", 3);
		const b = parseBlock("/** @csspart link - The anchor. */", 3);
		expect(a.tags).toEqual(b.tags);
		expect(a.tags[0]).toMatchObject({ name: "link", description: "The anchor.", line: 3 });
	});

	it("keeps line breaks in @example", () => {
		const b = parseBlock("-\n@example Title\n<a>\n  <b></b>\n</a>\n@since 1.0.0\n-", 1);
		expect(b.tags[0]!.description).toBe("Title\n<a>\n  <b></b>\n</a>");
		expect(b.tags[1]).toMatchObject({ tag: "since", name: "1.0.0" });
	});

	it("handles starred JSDoc lines", () => {
		const b = parseBlock("/**\n * Does a thing.\n * @fires {Event} done - Finished.\n */", 1);
		expect(b.description).toBe("Does a thing.");
		expect(b.tags[0]).toMatchObject({ tag: "fires", name: "done", type: "Event" });
	});

	it("returns an empty block for empty input", () => {
		expect(parseBlock("--", 1).tags).toEqual([]);
	});
});

describe("findJsdoc", () => {
	it("locates blocks and lines", () => {
		const found = findJsdoc("a\n/** one */\nb\n/** two */", 5);
		expect(found.map((f) => [f.raw, f.line])).toEqual([["/** one */", 6], ["/** two */", 8]]);
	});
});
