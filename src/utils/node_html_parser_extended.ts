import { HTMLElement as BaseHTMLElement, parse as baseParse, Node, NodeType } from "node-html-parser";

/**
 * EMFJS - JavaScript library for parsing and rendering EMF files.
 * Copyright (c) 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047. All rights reserved.
 * License: MIT (see LICENSE file for details)
 * Author: Zoltan Jancso
 * GitHub:
 */

class ExtendedHTMLElement extends BaseHTMLElement {
    constructor(tagName: string, options?: any) {
        super(tagName, options);
    }

    /**
     * Create a new element using the underlying HTML parser class but
     * allow callers to specify any broader `Element` interface.
     *
     * The generic constraint is deliberately `Element` instead of the
     * parser's own `HTMLElement` type so that SVG element types (e.g.
     * `SVGFEFloodElement`) can be used without a type error.
     */
    public createElement<T extends Element = Element>(tag: string, ns?: string): T {
        // We construct a parser HTMLElement here; if consumers need the
        // extended API on the created node they can cast back to
        // ExtendedHTMLElement themselves.
        const el = new BaseHTMLElement(tag, {});
        if (ns) {
            el.setAttribute('xmlns', ns);
        }
        return el as unknown as T;
    }

    /**
     * Analogous to `createElement` but preserves a namespace as a separate
     * argument, matching the DOM `createElementNS` signature used by SVG code.
     */
    public createElementNS<T extends Element = Element>(ns: string, tag: string): T {
        // The underlying parser doesn’t actually understand namespaces, it
        // only stores them as attributes, so we simply delegate to
        // `createElement` and then set the namespace attribute if needed.
        const el = this.createElement<T>(tag, ns);
        return el;
    }

   
}

// Walk an existing tree and switch its prototype to our subclass so that
// all nodes gain the extra helper methods (notably `createElement`).
function upgradeTree(node: any): void {
    if (!node || !(node instanceof BaseHTMLElement)) {
        return;
    }

    Object.setPrototypeOf(node, ExtendedHTMLElement.prototype);
    if (node.childNodes && Array.isArray(node.childNodes)) {
        node.childNodes.forEach(upgradeTree);
    }
}

/**
 * Drop‑in replacement for `node-html-parser`'s `parse` which returns an
 * `ExtendedHTMLElement` tree rather than the original type.  This allows
 * consumers to immediately call the helper methods on the root element
 * (and its descendants).
 */
export function parse(html: string, options?: any): ExtendedHTMLElement {
    const root = baseParse(html, options) as BaseHTMLElement;
    upgradeTree(root);
    return root as unknown as ExtendedHTMLElement;
}

export { ExtendedHTMLElement as HTMLElement };