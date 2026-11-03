import js from "@allons-y/opx-lint-js/eslint.config.js";
import json from "@allons-y/opx-lint-json/eslint.config.js";
import md from "@allons-y/opx-lint-md/eslint.config.js";
import licenseHeader from "eslint-plugin-license-header";

export default [
	...js,
	...json,
	...md,
	{
		files: ["**/src/**", "**/test/**", "**/bin/**"],
		plugins: { "license-header": licenseHeader },
		rules: {
			"license-header/header": ["error", "./.license-header.js"],
		},
	},
];
