/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { describe, expect, it } from "vitest";
import { getCustomElements, isCustomElementDeclaration, normalizeModulePath, parse, toManifest } from "../src/index.js";
import type { CustomElementDeclaration } from "custom-elements-manifest/schema.js";

describe("toManifest", () => {
	const record = parse("<!---\nSummary text.\n@summary Short.\n@prop {string} [label=Hi] - Text.\n@slot - Body.\n@csspart p - Part.\n@fires {CustomEvent} go - Went.\n@demo https://x.test - Demo.\n--->\n<slot></slot>", { path: "./components/my-card.webc" });
	const manifest = toManifest([record], { readme: "README.md" });

	it("builds one module per record with a custom element export", () => {
		expect(manifest.schemaVersion).toBe("2.1.0");
		const mod = manifest.modules[0]!;
		expect(mod.path).toBe("components/my-card.webc");
		expect(mod.exports).toEqual([{ kind: "custom-element-definition", name: "my-card", declaration: { name: "MyCard", module: "components/my-card.webc" } }]);
		const decl = mod.declarations![0] as CustomElementDeclaration;
		expect(decl).toMatchObject({ kind: "class", customElement: true, name: "MyCard", tagName: "my-card", summary: "Short." });
		expect(decl.attributes).toEqual([{ name: "label", description: "Text.", type: { text: "string" }, default: "Hi", fieldName: "label" }]);
		expect(decl.slots).toEqual([{ name: "", description: "Body." }]);
		expect(decl.events).toEqual([{ name: "go", description: "Went.", type: { text: "CustomEvent" } }]);
		expect(decl.demos).toEqual([{ url: "https://x.test", description: "Demo." }]);
		expect(decl).toHaveProperty("webc.host");
	});

	it("exposes typed predicates and helpers", () => {
		const found = getCustomElements(manifest);
		expect(found).toHaveLength(1);
		expect(isCustomElementDeclaration(found[0]!.declaration)).toBe(true);
		expect(normalizeModulePath("./a\\b.webc")).toBe("a/b.webc");
	});
});
