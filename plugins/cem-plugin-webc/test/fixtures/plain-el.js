/**
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) 2026 Allons-y Studio
 */

/* global HTMLElement, customElements */

/** A plain element. */
export class PlainEl extends HTMLElement {}
customElements.define("plain-el", PlainEl);
