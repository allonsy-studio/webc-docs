/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it, vi } from "vitest";
import type { CustomElementDeclaration, CustomElementExport } from "custom-elements-manifest/schema.js";
import { analyze } from "./helpers.js";

const elements = (m: ReturnType<typeof analyze>) =>
	m.modules.flatMap((mod) => (mod.declarations ?? []).filter((d): d is CustomElementDeclaration => d.kind === "class" && "customElement" in d));
const definitions = (m: ReturnType<typeof analyze>) =>
	m.modules.flatMap((mod) => (mod.exports ?? []).filter((e): e is CustomElementExport => e.kind === "custom-element-definition"));

describe("guarded define", () => {
	it("links a define inside a block and an if guard to its class", () => {
		const manifest = analyze(["guarded.webc"]);
		const [el] = elements(manifest);
		expect(elements(manifest)).toHaveLength(1);
		expect(el.name).toBe("TogButton");
		expect(el.tagName).toBe("tog-button");
		expect(definitions(manifest)).toEqual([
			{ kind: "custom-element-definition", name: "tog-button", declaration: { name: "TogButton", module: "guarded.webc" } },
		]);
	});

	it("fills header docs the class lacks and keeps the class description", () => {
		const [el] = elements(analyze(["guarded.webc"]));
		expect(el.description).toBe("Toggle element.");
		expect(el.summary).toBe("Toggle button.");
		expect(el.slots?.map((s) => s.name)).toEqual(["", "icon"]);
		expect(el.cssProperties?.[0]).toMatchObject({ name: "--tog-bg", syntax: "<color>" });
		expect(el.cssParts?.map((p) => p.name)).toEqual(["button"]);
		expect(el.attributes?.map((a) => a.name)).toEqual(["pressed"]);
	});
});

describe("no script", () => {
	it("adds a declaration and definition named after the file", () => {
		const manifest = analyze(["no-script.webc"]);
		const [el] = elements(manifest);
		expect(el).toMatchObject({ name: "NoScript", tagName: "no-script", customElement: true, summary: "Card." });
		expect(el.slots?.map((s) => s.name)).toEqual(["footer"]);
		expect(definitions(manifest)).toEqual([
			{ kind: "custom-element-definition", name: "no-script", declaration: { name: "NoScript", module: "no-script.webc" } },
		]);
	});

	it("puts WebC facts under the webc key", () => {
		const [el] = elements(analyze(["no-script.webc"]));
		expect((el as unknown as { webc: { host: unknown } }).webc.host).toEqual({ rendered: true, reason: "style" });
	});
});

describe("class and header both document a slot", () => {
	it("keeps the class slots and the class description", () => {
		const [el] = elements(analyze(["class-wins.webc"]));
		expect(el.slots).toEqual([{ name: "icon", description: "Class icon description." }]);
		expect(el.description).toBe("Class description.");
	});

	it("still fills fields the class leaves empty", () => {
		const [el] = elements(analyze(["class-wins.webc"]));
		expect(el.summary).toBe("Header summary.");
		expect(el.cssParts?.map((p) => p.name)).toEqual(["label"]);
	});
});

describe("line numbers", () => {
	it("keeps the class on its .webc line in the virtual source", async () => {
		const { ts } = await import("@custom-elements-manifest/analyzer");
		const { webcModuleCreation } = await import("../src/index.js");
		const { FIXTURES } = await import("./helpers.js");
		const [sf] = webcModuleCreation({ cwd: FIXTURES })({ ts, globs: ["line-check.webc"] });
		const cls = sf.statements.find(ts.isClassDeclaration)!;
		expect(sf.fileName).toBe("line-check.webc");
		expect(sf.getLineAndCharacterOfPosition(cls.getStart()).line + 1).toBe(7);
	});
});

describe("dev log", () => {
	const lines = (globs: string[], dev: boolean) => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {});
		analyze(globs, dev);
		const out = log.mock.calls.map((c) => String(c[0])).filter((l) => l.startsWith("[WEBC]"));
		log.mockRestore();
		return out;
	};

	it("prints parser warnings with the .webc line when dev is on", () => {
		expect(lines(["missing-slot.webc"], true)).toEqual([expect.stringMatching(/^\[WEBC\] missing-slot\.webc:\d+ slot-missing /)]);
	});

	it("prints nothing when dev is off", () => {
		expect(lines(["missing-slot.webc"], false)).toEqual([]);
	});
});

describe("js modules", () => {
	it("analyzes a plain .js file the way the analyzer does", () => {
		const manifest = analyze(["plain-el.js", "no-script.webc"]);
		expect(manifest.modules.map((m) => m.path)).toEqual(["plain-el.js", "no-script.webc"]);
		expect(elements(manifest).map((e) => e.tagName)).toEqual(["plain-el", "no-script"]);
	});
});
