/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

import type { ComponentRecord } from "@allons-y/webcdoc";

interface WebcPage {
	setContent(content: string, path?: string): void;
	defineComponents(components: unknown): void;
	setHelper(name: string, fn: (...args: never[]) => unknown, scoped?: boolean): void;
	compile(setup?: unknown): Promise<{ html: string }>;
}
interface WebcModule {
	WebC: { new (): WebcPage; getComponentsMap(globs: string[]): Record<string, string> };
}

/**
 * Compiles every `@example` through @11ty/webc with the configured components, the host's functions, and the global data, and stores the result on `html`.
 * An example that fails to compile keeps no `html`; the failure goes to `onError`.
 */
export async function renderExamples(
	records: ComponentRecord[],
	globs: string[],
	host: { data: Record<string, unknown>; functions: Record<string, unknown> },
	onError: (message: string) => void,
): Promise<void> {
	let webc: WebcModule;
	try {
		const specifier = "@11ty/webc";
		webc = (await import(specifier)) as WebcModule;
	} catch {
		onError("renderExamples needs @11ty/webc, which could not be loaded.");
		return;
	}
	const components = webc.WebC.getComponentsMap(globs);
	for (const record of records) {
		for (const example of record.examples) {
			try {
				const page = new webc.WebC();
				page.setContent(example.code);
				page.defineComponents(components);
				for (const [name, fn] of Object.entries(host.functions)) if (typeof fn === "function") page.setHelper(name, fn as never);
				example.html = (await page.compile({ data: { page: {}, ...host.data } })).html.trim();
			} catch (error) {
				onError(`Example "${example.title}" of <${record.tagName}> did not compile: ${(error as Error).message}`);
			}
		}
	}
}
