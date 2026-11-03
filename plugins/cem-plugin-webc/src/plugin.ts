/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import { toManifest } from "@allons-y/webcdoc";
import type { ComponentRecord } from "@allons-y/webcdoc";
import type { ClassDeclaration, CustomElementDeclaration, Module } from "custom-elements-manifest/schema.js";
import { recordFor } from "./cache.js";
import { isWebc } from "./module-creation.js";

export interface WebcPluginOptions {
	/** Directory the analyzer's globs are relative to. Defaults to the current directory. */
	cwd?: string;
	/** Names a host provides; replaces the default helper list. */
	helpers?: string[];
}

/** The part of the analyzer's plugin shape used here; its own typings do not resolve under NodeNext. */
export interface AnalyzerPlugin {
	name: string;
	moduleLinkPhase?(params: { moduleDoc: Module; context: Record<string, unknown> }): void;
}

type Declaration = NonNullable<Module["declarations"]>[number];
type Doc = CustomElementDeclaration & Record<string, unknown>;

/** Fields copied from the .webc header only when the class leaves them empty. */
const FILL = ["summary", "description", "attributes", "slots", "cssProperties", "cssParts", "cssStates", "events"] as const;

const BASES = new Set(["HTMLElement", "LitElement", "FASTElement"]);
const isClass = (d: Declaration): d is ClassDeclaration => d.kind === "class";
const isEmpty = (v: unknown): boolean => v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

/** The class that is this file's element: the one a define call named, else a lone or HTMLElement-based class. */
function findElement(moduleDoc: Module): { klass?: Doc; defined: boolean } {
	const classes = (moduleDoc.declarations ?? []).filter(isClass);
	const defined = (moduleDoc.exports ?? []).find((e) => e.kind === "custom-element-definition");
	const named = defined && classes.find((c) => c.name === defined.declaration.name);
	if (named) return { klass: named as Doc, defined: true };
	const guess = classes.find((c) => BASES.has(c.superclass?.name ?? "")) ?? (classes.length === 1 ? classes[0] : undefined);
	return { klass: guess as Doc | undefined, defined: false };
}

/** Warnings go to the analyzer's dev log, one line each, at the .webc line. */
function logWarnings(record: ComponentRecord): void {
	for (const w of record.warnings) console.log(`[WEBC] ${record.path}:${w.line ?? 1} ${w.code} ${w.message}`);
}

/** Merges one parsed .webc record into the analyzer's module for that file. */
export function mergeRecord(moduleDoc: Module, record: ComponentRecord): void {
	const generated = toManifest([record]).modules[0]!;
	const fresh = generated.declarations![0] as Doc;
	const { klass, defined } = findElement(moduleDoc);
	const webc = fresh.webc;

	if (!klass) {
		moduleDoc.declarations = [...(moduleDoc.declarations ?? []), fresh as Declaration];
		moduleDoc.exports = [
			...(moduleDoc.exports ?? []),
			{ kind: "custom-element-definition", name: record.tagName, declaration: { name: fresh.name, module: moduleDoc.path } },
		];
		return;
	}

	for (const field of FILL) if (isEmpty(klass[field]) && !isEmpty(fresh[field])) (klass as Record<string, unknown>)[field] = fresh[field];
	klass.webc = webc;
	if (!defined) {
		klass.tagName ??= record.tagName;
		klass.customElement = true;
		moduleDoc.exports = [
			...(moduleDoc.exports ?? []),
			{ kind: "custom-element-definition", name: klass.tagName!, declaration: { name: klass.name, module: moduleDoc.path } },
		];
	}
}

/** Returns the analyzer plugin that merges each .webc file's documentation into its module. */
export function webcPlugin(options: WebcPluginOptions = {}): AnalyzerPlugin {
	const cwd = options.cwd ?? process.cwd();
	return {
		name: "allons-y/cem-plugin-webc",
		moduleLinkPhase({ moduleDoc, context }) {
			if (!isWebc(moduleDoc.path)) return;
			const record = recordFor(cwd, moduleDoc.path, options.helpers);
			if (context.dev) logWarnings(record);
			mergeRecord(moduleDoc, record);
		},
	};
}
