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
exports.GDIContext = void 0;
const Helper_1 = require("./Helper");
const Primitives_1 = require("./Primitives");
const Region_1 = require("./Region");
const Style_1 = require("./Style");
class GDIContextState {
    constructor(copy, defObjects) {
        if (copy != null) {
            this._svggroup = copy._svggroup;
            this._svgclipChanged = copy._svgclipChanged;
            this._svgtextbkfilter = copy._svgtextbkfilter;
            this.mapmode = copy.mapmode;
            this.stretchmode = copy.stretchmode;
            this.textalign = copy.textalign;
            this.bkmode = copy.bkmode;
            this.textcolor = copy.textcolor.clone();
            this.bkcolor = copy.bkcolor.clone();
            this.polyfillmode = copy.polyfillmode;
            this.wx = copy.wx;
            this.wy = copy.wy;
            this.ww = copy.ww;
            this.wh = copy.wh;
            this.vx = copy.vx;
            this.vy = copy.vy;
            this.vw = copy.vw;
            this.vh = copy.vh;
            this.x = copy.x;
            this.y = copy.y;
            this.clip = copy.clip;
            this.ownclip = false;
            this.selected = {};
            for (const type in copy.selected) {
                this.selected[type] = copy.selected[type];
            }
        }
        else {
            this._svggroup = null;
            this._svgclipChanged = false;
            this._svgtextbkfilter = null;
            this.mapmode = Helper_1.Helper.GDI.MapMode.MM_ANISOTROPIC;
            this.stretchmode = Helper_1.Helper.GDI.StretchMode.COLORONCOLOR;
            this.textalign = 0; // TA_LEFT | TA_TOP | TA_NOUPDATECP
            this.bkmode = Helper_1.Helper.GDI.MixMode.OPAQUE;
            this.textcolor = new Style_1.ColorRef(null, 0, 0, 0);
            this.bkcolor = new Style_1.ColorRef(null, 255, 255, 255);
            this.polyfillmode = Helper_1.Helper.GDI.PolyFillMode.ALTERNATE;
            this.wx = 0;
            this.wy = 0;
            this.ww = 0;
            this.wh = 0;
            this.vx = 0;
            this.vy = 0;
            this.vw = 0;
            this.vh = 0;
            this.x = 0;
            this.y = 0;
            this.clip = null;
            this.ownclip = false;
            let selected = {};
            for (const type in defObjects) {
                const defObj = defObjects[type];
                selected[type] = defObj != null ? defObj.clone() : null;
            }
            this.selected = selected;
        }
    }
}
class GDIContext {
    constructor(svg) {
        this._svg = svg;
        this._svgdefs = null;
        this._svgPatterns = {};
        this._svgClipPaths = {};
        this.defObjects = {
            brush: new Style_1.Brush(null, null),
            pen: new Style_1.Pen(null, Helper_1.Helper.GDI.PenStyle.PS_SOLID, new Primitives_1.PointS(null, 1, 1), new Style_1.ColorRef(null, 0, 0, 0), 0, 0),
            font: new Style_1.Font(null, null),
            palette: null,
            region: null,
        };
        this.state = new GDIContextState(null, this.defObjects);
        this.statestack = [this.state];
        this.objects = {};
    }
    setMapMode(mode) {
        Helper_1.Helper.log("[gdi] setMapMode: mode=" + mode);
        this.state.mapmode = mode;
        this.state._svggroup = null;
    }
    setWindowOrg(x, y) {
        Helper_1.Helper.log("[gdi] setWindowOrg: x=" + x + " y=" + y);
        this.state.wx = x;
        this.state.wy = y;
        this.state._svggroup = null;
    }
    setWindowExt(x, y) {
        Helper_1.Helper.log("[gdi] setWindowExt: x=" + x + " y=" + y);
        this.state.ww = x;
        this.state.wh = y;
        this.state._svggroup = null;
    }
    offsetWindowOrg(offX, offY) {
        Helper_1.Helper.log("[gdi] offsetWindowOrg: offX=" + offX + " offY=" + offY);
        this.state.wx += offX;
        this.state.wy += offY;
        this.state._svggroup = null;
    }
    setViewportOrg(x, y) {
        Helper_1.Helper.log("[gdi] setViewportOrg: x=" + x + " y=" + y);
        this.state.vx = x;
        this.state.vy = y;
        this.state._svggroup = null;
    }
    setViewportExt(x, y) {
        Helper_1.Helper.log("[gdi] setViewportExt: x=" + x + " y=" + y);
        this.state.vw = x;
        this.state.vh = y;
        this.state._svggroup = null;
    }
    offsetViewportOrg(offX, offY) {
        Helper_1.Helper.log("[gdi] offsetViewportOrg: offX=" + offX + " offY=" + offY);
        this.state.vx += offX;
        this.state.vy += offY;
        this.state._svggroup = null;
    }
    saveDC() {
        Helper_1.Helper.log("[gdi] saveDC");
        const prevstate = this.state;
        this.state = new GDIContextState(this.state);
        this.statestack.push(prevstate);
        this.state._svggroup = null;
    }
    restoreDC(saved) {
        Helper_1.Helper.log("[gdi] restoreDC: saved=" + saved);
        if (this.statestack.length > 1) {
            if (saved === -1) {
                let tmp = this.statestack.pop();
                if (typeof tmp !== 'undefined')
                    this.state = tmp;
            }
            else if (saved < -1) {
                throw new Helper_1.WMFJSError("restoreDC: relative restore not implemented");
            }
            else if (saved > 1) {
                throw new Helper_1.WMFJSError("restoreDC: absolute restore not implemented");
            }
        }
        else {
            throw new Helper_1.WMFJSError("No saved contexts");
        }
        this.state._svggroup = null;
    }
    escape(func, blob, offset, count) {
        Helper_1.Helper.log("[gdi] escape: func=" + func + " offset=" + offset + " count=" + count);
    }
    setStretchBltMode(stretchMode) {
        Helper_1.Helper.log("[gdi] setStretchBltMode: stretchMode=" + stretchMode);
    }
    stretchDib(srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH, rasterOp, colorUsage, dib) {
        Helper_1.Helper.log("[gdi] stretchDib: srcX=" + srcX + " srcY=" + srcY + " srcW=" + srcW + " srcH=" + srcH
            + " dstX=" + dstX + " dstY=" + dstY + " dstW=" + dstW + " dstH=" + dstH
            + " rasterOp=0x" + rasterOp.toString(16));
        srcX = this._todevX(srcX);
        srcY = this._todevY(srcY);
        srcW = this._todevW(srcW);
        srcH = this._todevH(srcH);
        dstX = this._todevX(dstX);
        dstY = this._todevY(dstY);
        dstW = this._todevW(dstW);
        dstH = this._todevH(dstH);
        Helper_1.Helper.log("[gdi] stretchDib: TRANSLATED: srcX=" + srcX + " srcY=" + srcY + " srcW=" + srcW + " srcH=" + srcH
            + " dstX=" + dstX + " dstY=" + dstY + " dstW=" + dstW + " dstH=" + dstH
            + " rasterOp=0x" + rasterOp.toString(16) + " colorUsage=0x" + colorUsage.toString(16));
        this._pushGroup();
        this._svg.image(this.state._svggroup, dstX, dstY, dstW, dstH, dib.base64ref());
    }
    dibBits(srcX, srcY, dstX, dstY, width, height, rasterOp, dib) {
        Helper_1.Helper.log("[gdi] stretchDibBits: srcX=" + srcX + " srcY=" + srcY
            + " dstX=" + dstX + " dstY=" + dstY + " width=" + width + " height=" + height
            + " rasterOp=0x" + rasterOp.toString(16));
        srcX = this._todevX(srcX);
        srcY = this._todevY(srcY);
        dstX = this._todevX(dstX);
        dstY = this._todevY(dstY);
        width = this._todevW(width);
        height = this._todevH(height);
        Helper_1.Helper.log("[gdi] dibBits: TRANSLATED:"
            + " srcX=" + srcX + " srcY=" + srcY + +" dstX=" + dstX + " dstY=" + dstY
            + " width=" + width + " height=" + height + " rasterOp=0x" + rasterOp.toString(16));
        this._pushGroup();
        this._svg.image(this.state._svggroup, dstX, dstY, width, height, dib.base64ref());
    }
    stretchDibBits(srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH, rasterOp, dib) {
        Helper_1.Helper.log("[gdi] stretchDibBits: srcX=" + srcX + " srcY=" + srcY + " srcW=" + srcW + " srcH=" + srcH
            + " dstX=" + dstX + " dstY=" + dstY + " dstW=" + dstW + " dstH=" + dstH
            + " rasterOp=0x" + rasterOp.toString(16));
        srcX = this._todevX(srcX);
        srcY = this._todevY(srcY);
        srcW = this._todevW(srcW);
        srcH = this._todevH(srcH);
        dstX = this._todevX(dstX);
        dstY = this._todevY(dstY);
        dstW = this._todevW(dstW);
        dstH = this._todevH(dstH);
        Helper_1.Helper.log("[gdi] stretchDibBits: TRANSLATED:"
            + " srcX=" + srcX + " srcY=" + srcY + " srcW=" + srcW + " srcH=" + srcH
            + " dstX=" + dstX + " dstY=" + dstY + " dstW=" + dstW + " dstH=" + dstH
            + " rasterOp=0x" + rasterOp.toString(16));
        this._pushGroup();
        this._svg.image(this.state._svggroup, dstX, dstY, dstW, dstH, dib.base64ref());
    }
    rectangle(rect, rw, rh) {
        let pen = this.state.selected?.pen;
        let brush = this.state.selected?.brush;
        if (pen && brush)
            Helper_1.Helper.log("[gdi] rectangle: rect=" + rect.toString() + " with pen " + pen.toString()
                + " and brush " + brush.toString());
        const bottom = this._todevY(rect.bottom);
        const right = this._todevX(rect.right);
        const top = this._todevY(rect.top);
        const left = this._todevX(rect.left);
        rw = this._todevH(rw);
        rh = this._todevH(rh);
        Helper_1.Helper.log("[gdi] rectangle: TRANSLATED: bottom=" + bottom + " right=" + right + " top=" + top
            + " left=" + left + " rh=" + rh + " rw=" + rw);
        this._pushGroup();
        const opts = this._applyOpts(null, true, true, false);
        this._svg.rect(this.state._svggroup, left, top, right - left, bottom - top, rw / 2, rh / 2, opts);
    }
    textOut(x, y, text) {
        var font = this.state.selected?.font;
        if (font)
            Helper_1.Helper.log("[gdi] textOut: x=" + x + " y=" + y + " text=" + text
                + " with font " + font.toString());
        x = this._todevX(x);
        y = this._todevY(y);
        Helper_1.Helper.log("[gdi] textOut: TRANSLATED: x=" + x + " y=" + y);
        this._pushGroup();
        const opts = this._applyOpts(null, false, false, true);
        if (font && font.escapement !== 0) {
            opts.transform = "rotate(" + [(-font.escapement / 10), x, y] + ")";
            opts.style = "dominant-baseline: middle; text-anchor: start;";
        }
        if (this.state.bkmode === Helper_1.Helper.GDI.MixMode.OPAQUE) {
            if (this.state._svgtextbkfilter == null) {
                const filterId = Helper_1.Helper._makeUniqueId("f");
                const filter = this._svg.filter(this._getSvgDef(), filterId, 0, 0, 1, 1);
                this._svg.filters.flood(filter, null, "#" + this.state.bkcolor.toHex(), 1.0);
                this._svg.filters.composite(filter, null, null, "SourceGraphic");
                this.state._svgtextbkfilter = filter;
            }
            opts.filter = "url(#" + this.state._svgtextbkfilter.id + ")";
        }
        this._svg.text(this.state._svggroup, x, y, text, opts);
    }
    extTextOut(x, y, text, fwOpts, rect, dx) {
        let font = this.state.selected.font;
        if (font)
            Helper_1.Helper.log("[gdi] extTextOut: x=" + x + " y=" + y + " text=" + text
                + " with font " + font.toString());
        x = this._todevX(x);
        y = this._todevY(y);
        Helper_1.Helper.log("[gdi] extTextOut: TRANSLATED: x=" + x + " y=" + y);
        this._pushGroup();
        const opts = this._applyOpts(null, false, false, true);
        if (font && font.escapement !== 0) {
            opts.transform = "rotate(" + [(-font.escapement / 10), x, y] + ")";
            opts.style = "dominant-baseline: middle; text-anchor: start;";
        }
        if (this.state.bkmode === Helper_1.Helper.GDI.MixMode.OPAQUE) {
            if (this.state._svgtextbkfilter == null) {
                const filterId = Helper_1.Helper._makeUniqueId("f");
                const filter = this._svg.filter(this._getSvgDef(), filterId, 0, 0, 1, 1);
                this._svg.filters.flood(filter, null, "#" + this.state.bkcolor.toHex(), 1.0);
                this._svg.filters.composite(filter, null, null, "SourceGraphic");
                this.state._svgtextbkfilter = filter;
            }
            opts.filter = "url(#" + this.state._svgtextbkfilter.id + ")";
        }
        this._svg.text(this.state._svggroup, x, y, text, opts);
    }
    lineTo(x, y) {
        let pen = this.state.selected.pen;
        if (pen)
            Helper_1.Helper.log("[gdi] lineTo: x=" + x + " y=" + y + " with pen " + pen.toString());
        const toX = this._todevX(x);
        const toY = this._todevY(y);
        const fromX = this._todevX(this.state.x);
        const fromY = this._todevY(this.state.y);
        // Update position
        this.state.x = x;
        this.state.y = y;
        Helper_1.Helper.log("[gdi] lineTo: TRANSLATED: toX=" + toX + " toY=" + toY + " fromX=" + fromX + " fromY=" + fromY);
        this._pushGroup();
        const opts = this._applyOpts(null, true, false, false);
        this._svg.line(this.state._svggroup, fromX, fromY, toX, toY, opts);
    }
    moveTo(x, y) {
        Helper_1.Helper.log("[gdi] moveTo: x=" + x + " y=" + y);
        this.state.x = x;
        this.state.y = y;
    }
    polygon(points, first) {
        let pen = this.state.selected.pen;
        let brush = this.state.selected.brush;
        if (pen && brush)
            Helper_1.Helper.log("[gdi] polygon: points=" + points + " with pen " + pen.toString()
                + " and brush " + brush.toString());
        const pts = [];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            pts.push([this._todevX(point.x), this._todevY(point.y)]);
        }
        Helper_1.Helper.log("[gdi] polygon: TRANSLATED: pts=" + pts);
        if (first) {
            this._pushGroup();
        }
        const opts = {
            "fill-rule": this.state.polyfillmode === Helper_1.Helper.GDI.PolyFillMode.ALTERNATE ? "evenodd" : "nonzero",
        };
        this._applyOpts(opts, true, true, false);
        this._svg.polygon(this.state._svggroup, pts, opts);
    }
    polyPolygon(polygons) {
        let pen = this.state.selected.pen;
        let brush = this.state.selected.brush;
        if (pen && brush)
            Helper_1.Helper.log("[gdi] polyPolygon: polygons.length=" + polygons.length
                + " with pen  " + pen.toString()
                + " and brush" + brush.toString());
        const cnt = polygons.length;
        for (let i = 0; i < cnt; i++) {
            this.polygon(polygons[i], i === 0);
        }
    }
    polyline(points) {
        let pen = this.state.selected.pen;
        if (pen)
            Helper_1.Helper.log("[gdi] polyline: points=" + points + " with pen " + pen.toString());
        const pts = [];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            pts.push([this._todevX(point.x), this._todevY(point.y)]);
        }
        Helper_1.Helper.log("[gdi] polyline: TRANSLATED: pts=" + pts);
        this._pushGroup();
        const opts = this._applyOpts({ fill: "none" }, true, false, false);
        this._svg.polyline(this.state._svggroup, pts, opts);
    }
    ellipse(rect) {
        let pen = this.state.selected.pen;
        let brush = this.state.selected.brush;
        if (pen && brush)
            Helper_1.Helper.log("[gdi] ellipse: rect=" + rect.toString() + " with pen " + pen.toString()
                + " and brush " + brush.toString());
        const bottom = this._todevY(rect.bottom);
        const right = this._todevX(rect.right);
        const top = this._todevY(rect.top);
        const left = this._todevX(rect.left);
        Helper_1.Helper.log("[gdi] ellipse: TRANSLATED: bottom=" + bottom + " right=" + right + " top=" + top + " left=" + left);
        this._pushGroup();
        const width2 = (right - left) / 2;
        const height2 = (bottom - top) / 2;
        const opts = this._applyOpts(null, true, true, false);
        this._svg.ellipse(this.state._svggroup, left + width2, top + height2, width2, height2, opts);
    }
    excludeClipRect(rect) {
        Helper_1.Helper.log("[gdi] excludeClipRect: rect=" + rect.toString());
        this._getClipRgn().subtract(rect);
    }
    intersectClipRect(rect) {
        Helper_1.Helper.log("[gdi] intersectClipRect: rect=" + rect.toString());
        this._getClipRgn().intersect(rect);
    }
    offsetClipRgn(offX, offY) {
        Helper_1.Helper.log("[gdi] offsetClipRgn: offX=" + offX + " offY=" + offY);
        this._getClipRgn().offset(offX, offY);
    }
    setTextAlign(textAlignmentMode) {
        Helper_1.Helper.log("[gdi] setTextAlign: textAlignmentMode=0x" + textAlignmentMode.toString(16));
        this.state.textalign = textAlignmentMode;
    }
    setBkMode(bkMode) {
        Helper_1.Helper.log("[gdi] setBkMode: bkMode=0x" + bkMode.toString(16));
        this.state.bkmode = bkMode;
    }
    setTextColor(textColor) {
        Helper_1.Helper.log("[gdi] setTextColor: textColor=" + textColor.toString());
        this.state.textcolor = textColor;
    }
    setBkColor(bkColor) {
        Helper_1.Helper.log("[gdi] setBkColor: bkColor=" + bkColor.toString());
        this.state.bkcolor = bkColor;
        this.state._svgtextbkfilter = null;
    }
    setPolyFillMode(polyFillMode) {
        Helper_1.Helper.log("[gdi] setPolyFillMode: polyFillMode=" + polyFillMode);
        this.state.polyfillmode = polyFillMode;
    }
    createBrush(brush) {
        const idx = this._storeObject(brush);
        Helper_1.Helper.log("[gdi] createBrush: brush=" + brush.toString() + " with handle " + idx);
    }
    createFont(font) {
        const idx = this._storeObject(font);
        Helper_1.Helper.log("[gdi] createFont: font=" + font.toString() + " with handle " + idx);
    }
    createPen(pen) {
        const idx = this._storeObject(pen);
        Helper_1.Helper.log("[gdi] createPen: pen=" + pen.toString() + " width handle " + idx);
    }
    createPalette(palette) {
        const idx = this._storeObject(palette);
        Helper_1.Helper.log("[gdi] createPalette: palette=" + palette.toString() + " width handle " + idx);
    }
    createRegion(region) {
        const idx = this._storeObject(region);
        Helper_1.Helper.log("[gdi] createRegion: region=" + region.toString() + " width handle " + idx);
    }
    createPatternBrush(patternBrush) {
        const idx = this._storeObject(patternBrush);
        Helper_1.Helper.log("[gdi] createRegion: region=" + patternBrush.toString() + " width handle " + idx);
    }
    selectObject(objIdx, checkType) {
        const obj = this._getObject(objIdx);
        if (obj != null && (checkType == null || obj.type === checkType)) {
            this._selectObject(obj);
            Helper_1.Helper.log("[gdi] selectObject: objIdx=" + objIdx
                + (obj ? " selected " + obj.type + ": " + obj.toString() : "[invalid index]"));
        }
        else {
            Helper_1.Helper.log("[gdi] selectObject: objIdx=" + objIdx
                + (obj ? " invalid object type: " + obj.type : "[invalid index]"));
        }
    }
    deleteObject(objIdx) {
        const ret = this._deleteObject(objIdx);
        Helper_1.Helper.log("[gdi] deleteObject: objIdx=" + objIdx + (ret ? " deleted object" : "[invalid index]"));
    }
    _pushGroup() {
        if (this.state._svggroup == null || this.state._svgclipChanged) {
            this.state._svgclipChanged = false;
            this.state._svgtextbkfilter = null;
            const settings = {
                viewBox: [this.state.vx, this.state.vy, this.state.vw, this.state.vh].join(" "),
                preserveAspectRatio: "none",
            };
            if (this.state.clip != null) {
                Helper_1.Helper.log("[gdi] new svg x=" + this.state.vx + " y=" + this.state.vy
                    + " width=" + this.state.vw + " height=" + this.state.vh + " with clipping");
                settings["clip-path"] = "url(#" + this._getSvgClipPathForRegion(this.state.clip) + ")";
            }
            else {
                Helper_1.Helper.log("[gdi] new svg x=" + this.state.vx + " y=" + this.state.vy
                    + " width=" + this.state.vw + " height=" + this.state.vh + " without clipping");
            }
            this.state._svggroup = this._svg.svg(this.state._svggroup, this.state.vx, this.state.vy, this.state.vw, this.state.vh, settings);
        }
    }
    _storeObject(obj) {
        let i = 0;
        while (this.objects[i.toString()] != null && i <= 65535) {
            i++;
        }
        if (i > 65535) {
            Helper_1.Helper.log("[gdi] Too many objects!");
            return -1;
        }
        this.objects[i.toString()] = obj;
        return i;
    }
    _getObject(objIdx) {
        const obj = this.objects[objIdx.toString()];
        if (obj == null) {
            Helper_1.Helper.log("[gdi] No object with handle " + objIdx);
        }
        return obj;
    }
    _getSvgDef() {
        if (this._svgdefs == null) {
            this._svgdefs = this._svg.defs();
        }
        return this._svgdefs;
    }
    _getSvgClipPathForRegion(region) {
        for (const existingId in this._svgClipPaths) {
            const rgn = this._svgClipPaths[existingId];
            if (rgn === region) {
                return existingId;
            }
        }
        const id = Helper_1.Helper._makeUniqueId("c");
        const sclip = this._svg.clipPath(this._getSvgDef(), id, "userSpaceOnUse");
        switch (region.complexity) {
            case 1:
                if (region && region.bounds)
                    this._svg.rect(sclip, this._todevX(region.bounds.left), this._todevY(region.bounds.top), this._todevW(region.bounds.right - region.bounds.left), this._todevH(region.bounds.bottom - region.bounds.top), { "fill": "black", "stroke-width": 0 });
                break;
            case 2:
                if (region && region.scans) {
                    for (let i = 0; i < region.scans.length; i++) {
                        const scan = region.scans[i];
                        for (let j = 0; j < scan.scanlines.length; j++) {
                            const scanline = scan.scanlines[j];
                            this._svg.rect(sclip, this._todevX(scanline.left), this._todevY(scan.top), this._todevW(scanline.right - scanline.left), this._todevH(scan.bottom - scan.top), { "fill": "black", "stroke-width": 0 });
                        }
                    }
                }
                break;
        }
        this._svgClipPaths[id] = region;
        return id;
    }
    _getSvgPatternForBrush(brush) {
        for (const existingId in this._svgPatterns) {
            const pat = this._svgPatterns[existingId];
            if (pat === brush) {
                return existingId;
            }
        }
        let width;
        let height;
        let img;
        switch (brush.style) {
            case Helper_1.Helper.GDI.BrushStyle.BS_PATTERN:
                width = brush.pattern.getWidth();
                height = brush.pattern.getHeight();
                break;
            case Helper_1.Helper.GDI.BrushStyle.BS_DIBPATTERNPT:
                width = brush.dibpatternpt.getWidth();
                height = brush.dibpatternpt.getHeight();
                img = brush.dibpatternpt.base64ref();
                break;
            default:
                throw new Helper_1.WMFJSError("Invalid brush style");
        }
        const id = Helper_1.Helper._makeUniqueId("p");
        const spat = this._svg.pattern(this._getSvgDef(), id, 0, 0, width, height, { patternUnits: "userSpaceOnUse" });
        if (img)
            this._svg.image(spat, 0, 0, width, height, img);
        this._svgPatterns[id] = brush;
        return id;
    }
    _selectObject(obj) {
        this.state.selected[obj.type] = obj;
        if (obj.type === "region") {
            this.state._svgclipChanged = true;
        }
    }
    _deleteObject(objIdx) {
        const obj = this.objects[objIdx.toString()];
        if (obj != null) {
            for (let i = 0; i < this.statestack.length; i++) {
                const state = this.statestack[i];
                if (state.selected[obj.type] === obj) {
                    let tmp = this.defObjects[obj.type];
                    if (tmp)
                        state.selected[obj.type] = tmp.clone();
                }
            }
            delete this.objects[objIdx.toString()];
            return true;
        }
        Helper_1.Helper.log("[gdi] Cannot delete object with invalid handle " + objIdx);
        return false;
    }
    _getClipRgn() {
        if (this.state.clip != null) {
            if (!this.state.ownclip) {
                this.state.clip = this.state.clip.clone();
            }
        }
        else {
            if (this.state.selected.region != null) {
                this.state.clip = this.state.selected.region.clone();
            }
            else {
                this.state.clip = (0, Region_1.CreateSimpleRegion)(this.state.wx, this.state.wy, this.state.wx + this.state.ww, this.state.wy + this.state.wh);
            }
        }
        this.state.ownclip = true;
        return this.state.clip;
    }
    _todevX(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor((val - this.state.wx) * (this.state.vw / this.state.ww)) + this.state.vx;
    }
    _todevY(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor((val - this.state.wy) * (this.state.vh / this.state.wh)) + this.state.vy;
    }
    _todevW(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor(val * (this.state.vw / this.state.ww)) + this.state.vx;
    }
    _todevH(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor(val * (this.state.vh / this.state.wh)) + this.state.vy;
    }
    _tologicalX(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor((val - this.state.vx) / (this.state.vw / this.state.ww)) + this.state.wx;
    }
    _tologicalY(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor((val - this.state.vy) / (this.state.vh / this.state.wh)) + this.state.wy;
    }
    _tologicalW(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor(val / (this.state.vw / this.state.ww)) + this.state.wx;
    }
    _tologicalH(val) {
        // http://wvware.sourceforge.net/caolan/mapmode.html
        // logical -> device
        return Math.floor(val / (this.state.vh / this.state.wh)) + this.state.wy;
    }
    _applyOpts(opts, usePen, useBrush, useFont) {
        if (opts == null) {
            opts = {};
        }
        if (usePen) {
            const pen = this.state.selected.pen;
            if (pen && pen.style !== Helper_1.Helper.GDI.PenStyle.PS_NULL) {
                opts.stroke = "#" + pen.color.toHex(), // TODO: pen style
                    opts["stroke-width"] = this._todevW(pen.width.x); // TODO: is .y ever used?
                let dotWidth;
                if ((pen.linecap & Helper_1.Helper.GDI.PenStyle.PS_ENDCAP_SQUARE) !== 0) {
                    opts["stroke-linecap"] = "square";
                    dotWidth = 1;
                }
                else if ((pen.linecap & Helper_1.Helper.GDI.PenStyle.PS_ENDCAP_FLAT) !== 0) {
                    opts["stroke-linecap"] = "butt";
                    dotWidth = opts["stroke-width"];
                }
                else {
                    opts["stroke-linecap"] = "round";
                    dotWidth = 1;
                }
                if ((pen.join & Helper_1.Helper.GDI.PenStyle.PS_JOIN_BEVEL) !== 0) {
                    opts["stroke-linejoin"] = "bevel";
                }
                else if ((pen.join & Helper_1.Helper.GDI.PenStyle.PS_JOIN_MITER) !== 0) {
                    opts["stroke-linejoin"] = "miter";
                }
                else {
                    opts["stroke-linejoin"] = "round";
                }
                const dashWidth = opts["stroke-width"] * 4;
                const dotSpacing = opts["stroke-width"] * 2;
                switch (pen.style) {
                    case Helper_1.Helper.GDI.PenStyle.PS_DASH:
                        opts["stroke-dasharray"] = [dashWidth, dotSpacing].toString();
                        break;
                    case Helper_1.Helper.GDI.PenStyle.PS_DOT:
                        opts["stroke-dasharray"] = [dotWidth, dotSpacing].toString();
                        break;
                    case Helper_1.Helper.GDI.PenStyle.PS_DASHDOT:
                        opts["stroke-dasharray"] = [dashWidth, dotSpacing, dotWidth, dotSpacing].toString();
                        break;
                    case Helper_1.Helper.GDI.PenStyle.PS_DASHDOTDOT:
                        opts["stroke-dasharray"]
                            = [dashWidth, dotSpacing, dotWidth, dotSpacing, dotWidth, dotSpacing].toString();
                        break;
                }
            }
        }
        if (useBrush) {
            const brush = this.state.selected.brush;
            if (brush)
                switch (brush.style) {
                    case Helper_1.Helper.GDI.BrushStyle.BS_SOLID:
                        opts.fill = "#" + brush.color.toHex();
                        break;
                    case Helper_1.Helper.GDI.BrushStyle.BS_PATTERN:
                    case Helper_1.Helper.GDI.BrushStyle.BS_DIBPATTERNPT:
                        opts.fill = "url(#" + this._getSvgPatternForBrush(brush) + ")";
                        break;
                    case Helper_1.Helper.GDI.BrushStyle.BS_NULL:
                        opts.fill = "none";
                        break;
                    default:
                        Helper_1.Helper.log("[gdi] unsupported brush style: " + brush.style);
                        opts.fill = "none";
                        break;
                }
        }
        if (useFont) {
            const font = this.state.selected.font;
            if (font) {
                opts["font-family"] = font.facename;
                opts["font-size"] = this._todevH(Math.abs(font.height));
                opts.fill = "#" + this.state.textcolor.toHex();
            }
        }
        return opts;
    }
}
exports.GDIContext = GDIContext;
