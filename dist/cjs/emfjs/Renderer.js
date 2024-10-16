"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Renderer = void 0;
const SVG_1 = require("../SVG");
const Blob_1 = require("./Blob");
const EMFRecords_1 = require("./EMFRecords");
const GDIContext_1 = require("./GDIContext");
const Helper_1 = require("./Helper");
const node_html_parser_1 = require("node-html-parser");
const Primitives_1 = require("./Primitives");
class Renderer {
    constructor(blob) {
        this.parse(blob);
        Helper_1.Helper.log("EMFJS.Renderer instantiated");
        this._rootElement = (0, node_html_parser_1.parse)("<div></div>", {
            lowerCaseTagName: false,
            comment: true,
            voidTag: {
                tags: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'p'],
                closingSlash: true
            },
        });
    }
    render(info) {
        const svgElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._render(new SVG_1.SVG(svgElement, this._rootElement), info.mapMode, info.wExt, info.hExt, info.xExt, info.yExt);
        let element = svgElement.firstChild;
        svgElement.firstChild.setAttribute('height', element.getAttribute('height') * info.endScale + 'mm');
        svgElement.firstChild.setAttribute('width', element.getAttribute('width') * info.endScale + 'mm');
        svgElement.firstChild.setAttribute('viewBox', (0, Primitives_1.resizeViewBox)(svgElement.firstChild.getAttribute('viewBox'), info.endScale));
        svgElement.firstChild.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        let paths = svgElement.getElementsByTagName('path');
        for (const path of paths) {
            let newD = (0, Primitives_1.resizePath)(path.getAttribute('d'), info.endScale);
            path.setAttribute('d', newD);
        }
        let svgString = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + svgElement.toString().replace(/<svg\s+[^>]*>/, '').replace('</svg>', '');
        return svgString;
    }
    parse(blob) {
        this._img = null;
        const reader = new Blob_1.Blob(blob);
        const type = reader.readUint32();
        if (type !== 0x00000001) {
            throw new Helper_1.EMFJSError("Not an EMF file");
        }
        const size = reader.readUint32();
        if (size % 4 !== 0) {
            throw new Helper_1.EMFJSError("Not an EMF file");
        }
        this._img = new EMF(reader, size);
        if (this._img == null) {
            throw new Helper_1.EMFJSError("Format not recognized");
        }
    }
    _render(svg, mapMode, w, h, xExt, yExt) {
        const gdi = new GDIContext_1.GDIContext(svg);
        gdi.setWindowExtEx(w, h);
        gdi.setViewportExtEx(xExt, yExt);
        gdi.setMapMode(mapMode);
        Helper_1.Helper.log("[EMF] BEGIN RENDERING --->");
        if (this._img)
            this._img.render(gdi);
        Helper_1.Helper.log("[EMF] <--- DONE RENDERING");
    }
}
exports.Renderer = Renderer;
class EMF {
    constructor(reader, hdrsize) {
        this._hdrsize = hdrsize;
        this._records = new EMFRecords_1.EMFRecords(reader, this._hdrsize);
        Helper_1.Helper.log(`[EMF]: ${this._records._header}`);
    }
    render(gdi) {
        this._records.play(gdi);
    }
}
