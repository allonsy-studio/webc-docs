/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

export { getComponent, getComponentByPath, listTagNames } from "./get-component.js";
export { hasClientScript, hasWarning, isDeprecated, isDocumented, isPortable, rendersHostTag } from "./predicates.js";
export { normalizePath } from "./paths.js";
export { dependenciesOf, resolveUses, topologicalOrder } from "./resolve-uses.js";
export type { DependencyOptions, UseNode } from "./resolve-uses.js";
export { componentsUsing, hostRequirements } from "./references.js";
export type { HostRequirement } from "./references.js";
