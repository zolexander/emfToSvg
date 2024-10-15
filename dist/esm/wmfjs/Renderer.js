"use strict";
/*

The MIT License (MIT)

Copyright (c) 2015 Thomas Bluemel

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
const GDIContext_1 = require("./GDIContext");
const Helper_1 = require("./Helper");
const WMFRecords_1 = require("./WMFRecords");
const node_html_parser_1 = require("node-html-parser");
class Renderer {
    constructor(blob) {
        this.parse(blob);
        this._rootElement = (0, node_html_parser_1.parse)("<div></div>", {
            lowerCaseTagName: false,
            comment: true,
            voidTag: {
                tags: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'p'],
                closingSlash: true
            },
        });
        Helper_1.Helper.log("WMFJS.Renderer instantiated");
    }
    render(info) {
        const svgElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._render(new SVG_1.SVG(svgElement, this._rootElement), info.mapMode, info.xExt, info.yExt);
        svgElement.setAttribute("viewBox", [0, 0, Math.abs(info.xExt), Math.abs(info.yExt)].join(" "));
        svgElement.setAttribute("preserveAspectRatio", "none"); // TODO: MM_ISOTROPIC vs MM_ANISOTROPIC
        svgElement.setAttribute("width", Math.abs(parseFloat(info.width)));
        svgElement.setAttribute("height", Math.abs(parseFloat(info.height)));
        let svgString = `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n ${svgElement.toString().replace(/<svg\s+[^>]*>/, '').replace('</svg>', '').replaceAll('-', '')}`;
        return svgString;
    }
    parse(blob) {
        this._img = null;
        const reader = new Blob_1.Blob(blob);
        let type;
        let size;
        let placable;
        let headerstart;
        const key = reader.readUint32();
        if (key === 0x9ac6cdd7) {
            placable = new WMFPlacable(reader);
            headerstart = reader.pos;
            type = reader.readUint16();
            size = reader.readUint16();
        }
        else {
            headerstart = 0;
            type = key & 0xffff;
            size = (key >>> 16) & 0xffff;
        }
        switch (type) {
            case Helper_1.Helper.GDI.MetafileType.MEMORYMETAFILE:
            case Helper_1.Helper.GDI.MetafileType.DISKMETAFILE:
                if (size === Helper_1.Helper.GDI.METAHEADER_SIZE / 2) {
                    const version = reader.readUint16();
                    switch (version) {
                        case Helper_1.Helper.GDI.MetafileVersion.METAVERSION100:
                        case Helper_1.Helper.GDI.MetafileVersion.METAVERSION300:
                            if (placable)
                                this._img = new WMF(reader, placable, version, headerstart + (size * 2));
                            break;
                    }
                }
                break;
        }
        if (this._img == null) {
            throw new Helper_1.WMFJSError("Format not recognized");
        }
    }
    _render(svg, mapMode, xExt, yExt) {
        // See https://www-user.tu-chemnitz.de/~ygu/petzold/ch18b.htm
        const gdi = new GDIContext_1.GDIContext(svg);
        gdi.setViewportExt(xExt, yExt);
        gdi.setMapMode(mapMode);
        Helper_1.Helper.log("[WMF] BEGIN RENDERING --->");
        if (this._img)
            this._img.render(gdi);
        Helper_1.Helper.log("[WMF] <--- DONE RENDERING");
    }
}
exports.Renderer = Renderer;
class WMFRect16 {
    constructor(reader) {
        this.left = reader.readInt16();
        this.top = reader.readInt16();
        this.right = reader.readInt16();
        this.bottom = reader.readInt16();
    }
    getSettings() {
        let settings = {
            width: (this.right - this.left).toFixed(2),
            height: (this.top - this.bottom).toFixed(2),
            xExt: (this.right - this.left),
            yExt: (this.top - this.bottom),
            mapMode: 8
        };
        return settings;
    }
    toString() {
        return "{left: " + this.left + ", top: " + this.top + ", right: " + this.right
            + ", bottom: " + this.bottom + "}";
    }
}
class WMFPlacable {
    constructor(reader) {
        reader.skip(2);
        this.boundingBox = new WMFRect16(reader);
        this.unitsPerInch = reader.readInt16();
        reader.skip(4);
        reader.skip(2); // TODO: checksum
        Helper_1.Helper.log("Got bounding box " + this.boundingBox + " and " + this.unitsPerInch + " units/inch");
    }
}
class WMF {
    constructor(reader, placable, version, hdrsize) {
        this._version = version;
        this._hdrsize = hdrsize;
        this._placable = placable;
        this.records = new WMFRecords_1.WMFRecords(reader, this._hdrsize);
    }
    render(gdi) {
        this.records.play(gdi);
    }
}
