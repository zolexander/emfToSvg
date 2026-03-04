/*

The MIT License (MIT)

Copyright (c) 2016 Tom Zoehner
Copyright (c) 2018 Thomas Bluemel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { SVG } from "../SVG";
import { Blob } from "./Blob";
import { EMFRecords } from "./EMFRecords";
import { GDIContext } from "./GDIContext";
import { EMFJSError, Helper } from "./Helper";
import { HTMLElement, parse } from '../utils/node_html_parser_extended';
// SVGElement is only used for typing in render(); the extended parser uses the
// same underlying class so we can still import it from the original module if
// needed (the alias remains identical at runtime).

import { resizePath, resizeViewBox } from "./Primitives";

// options object for HTML parser instances shared by both renderers
const DEFAULT_PARSE_OPTIONS = {
    lowerCaseTagName: false,
    comment: true,
    voidTag: {
        tags: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr','p'],
        closingSlash: true,
    },
};
export interface IRendererSettings {
    width: string;
    height: string;
    wExt: number;
    hExt: number;
    xExt: number;
    yExt: number;
    endScale:number;
    mapMode: number;
}

export class Renderer {
    private _img: EMF|null;
    private _rootElement: HTMLElement;
    public scale: number;
    constructor(blob: ArrayBuffer) {
        this.parse(blob);
        // root element is an extended node-html-parser element with helpers
        this._rootElement = this._createRoot();
        Helper.log("EMFJS.Renderer instantiated");
    }

    private _createRoot(): HTMLElement {
        return parse("<div></div>", DEFAULT_PARSE_OPTIONS);
    }

    public render(info: IRendererSettings): string {
        // keep as any to satisfy SVG constructor which expects a DOM SVGElement
        const svgElement: any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "svg");

        this._render(
            new SVG(svgElement, this._rootElement),
            info.mapMode,
            info.wExt,
            info.hExt,
            info.xExt,
            info.yExt,
        );

        const rootChild = svgElement.firstChild as HTMLElement | null;
        if (rootChild) {
            const h = Number(rootChild.getAttribute('height'));
            const w = Number(rootChild.getAttribute('width'));
            rootChild.setAttribute('height', (h * info.endScale) + 'mm');
            rootChild.setAttribute('width', (w * info.endScale) + 'mm');
            rootChild.setAttribute('viewBox', resizeViewBox(rootChild.getAttribute('viewBox')!, info.endScale));
            rootChild.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }

        const paths = svgElement.getElementsByTagName('path');
        for (const path of paths) {
            const newD = resizePath(path.getAttribute('d')!, info.endScale);
            path.setAttribute('d', newD);
        }

        const inner = svgElement.toString().replace(/<svg\s+[^>]*>/, '').replace('</svg>', '');
        return "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + inner;
    }

    private parse(blob: ArrayBuffer) {
        this._img = null;

        const reader = new Blob(blob);

        const type = reader.readUint32();
        if (type !== 0x00000001) {
            throw new EMFJSError("Not an EMF file");
        }
        const size = reader.readUint32();
        if (size % 4 !== 0) {
            throw new EMFJSError("Not an EMF file");
        }

        this._img = new EMF(reader, size);

        if (this._img == null) {
            throw new EMFJSError("Format not recognized");
        }
    }

    private _render(svg: SVG, mapMode: number, w: number, h: number, xExt: number, yExt: number) {
        const gdi = new GDIContext(svg);
        gdi.setWindowExtEx(w, h);
        gdi.setViewportExtEx(xExt, yExt);
        gdi.setMapMode(mapMode);
        Helper.log("[EMF] BEGIN RENDERING --->");
        if(this._img) this._img.render(gdi);
        Helper.log("[EMF] <--- DONE RENDERING");

    }
}

// re-export parser so external code can work with the extended HTMLElement
// type without having to import the utils module directly.
export { parse };

class EMF {
    private _hdrsize: number;
    public  _records: EMFRecords;

    constructor(reader: Blob, hdrsize: number) {
        this._hdrsize = hdrsize;
        this._records = new EMFRecords(reader, this._hdrsize);
        Helper.log(`[EMF]: ${this._records._header}`)

    }

    public render(gdi: GDIContext): void {
        this._records.play(gdi);
    }
}
