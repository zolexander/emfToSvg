"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/*

The MIT License (MIT)

Copyright (c) 2016 Tom Zoehner
Copyright (c) 2018 Thomas Bluemel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
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
class Path extends Primitives_1.Obj {
    constructor(svgPath, copy) {
        super('path');
        if (svgPath != null) {
            this.svgPath = svgPath;
        }
        else {
            if (copy)
                this.svgPath = copy.svgPath;
        }
    }
    clone() {
        return new Path(null, this);
    }
    toString() {
        return '{[path]}';
    }
}
function createStockObjects() {
    // Create global stock objects
    const createSolidBrush = (r, g, b) => {
        return new Style_1.Brush(null, {
            style: Helper_1.Helper.GDI.BrushStyle.BS_SOLID,
            color: new Style_1.ColorRef(null, r, g, b),
        });
    };
    const createSolidPen = (r, g, b) => {
        return new Style_1.Pen(null, Helper_1.Helper.GDI.PenStyle.PS_SOLID, 1, new Style_1.ColorRef(null, r, g, b), null);
    };
    const stockObjs = {
        WHITE_BRUSH: createSolidBrush(255, 255, 255),
        LTGRAY_BRUSH: createSolidBrush(212, 208, 200),
        GRAY_BRUSH: createSolidBrush(128, 128, 128),
        DKGRAY_BRUSH: createSolidBrush(64, 64, 64),
        BLACK_BRUSH: createSolidBrush(0, 0, 0),
        NULL_BRUSH: new Style_1.Brush(null, {
            style: Helper_1.Helper.GDI.BrushStyle.BS_NULL,
        }),
        WHITE_PEN: createSolidPen(255, 255, 255),
        BLACK_PEN: createSolidPen(0, 0, 0),
        NULL_PEN: new Style_1.Pen(null, Helper_1.Helper.GDI.PenStyle.PS_NULL, 0, null, null),
        OEM_FIXED_FONT: null,
        ANSI_FIXED_FONT: null,
        ANSI_VAR_FONT: null,
        SYSTEM_FONT: null,
        DEVICE_DEFAULT_FONT: null,
        DEFAULT_PALETTE: null,
        SYSTEM_FIXED_FONT: null,
        DEFAULT_GUI_FONT: null, // TODO
    };
    const objs = {};
    for (const t in stockObjs) {
        const stockObjects = Helper_1.Helper.GDI.StockObject;
        const idx = stockObjects[t] - 0x80000000;
        objs[idx.toString()] = stockObjs[t];
    }
    return objs;
}
const _StockObjects = createStockObjects();
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
            this.miterlimit = copy.miterlimit;
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
            this.nextbrx = copy.nextbrx;
            this.nextbry = copy.nextbry;
            this.brx = copy.brx;
            this.bry = copy.bry;
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
            this.polyfillmode = Helper_1.Helper.GDI.PolygonFillMode.ALTERNATE;
            this.miterlimit = 10;
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
            this.nextbrx = 0;
            this.nextbry = 0;
            this.brx = 0;
            this.bry = 0;
            this.clip = null;
            this.ownclip = false;
            this.selected = {};
            for (const type in defObjects) {
                const defObj = defObjects[type];
                this.selected[type] = defObj != null ? defObj.clone() : null;
            }
        }
    }
}
class GDIContext {
    constructor(svg) {
        this._svg = svg;
        this._svgdefs = null;
        this._svgPatterns = {};
        this._svgClipPaths = {};
        this._svgPath = null;
        this.defObjects = {
            brush: new Style_1.Brush(null, {
                style: Helper_1.Helper.GDI.BrushStyle.BS_SOLID,
                color: new Style_1.ColorRef(null, 0, 0, 0),
            }),
            pen: new Style_1.Pen(null, Helper_1.Helper.GDI.PenStyle.PS_SOLID, 1, new Style_1.ColorRef(null, 0, 0, 0), null),
            font: new Style_1.Font(null, null),
            palette: null,
            region: null,
        };
        this.state = new GDIContextState(null, this.defObjects);
        this.statestack = [this.state];
        this.objects = {};
    }
    setMapMode(mode) {
        Helper_1.Helper.log('[gdi] setMapMode: mode=' + mode);
        this.state.mapmode = mode;
        this.state._svggroup = null;
    }
    setWindowOrgEx(x, y) {
        Helper_1.Helper.log('[gdi] setWindowOrgEx: x=' + x + ' y=' + y);
        this.state.wx = x;
        this.state.wy = y;
        this.state._svggroup = null;
    }
    setWindowExtEx(x, y) {
        Helper_1.Helper.log('[gdi] setWindowExtEx: x=' + x + ' y=' + y);
        this.state.ww = x;
        this.state.wh = y;
        this.state._svggroup = null;
    }
    setViewportOrgEx(x, y) {
        Helper_1.Helper.log('[gdi] setViewportOrgEx: x=' + x + ' y=' + y);
        this.state.vx = x;
        this.state.vy = y;
        this.state._svggroup = null;
    }
    setViewportExtEx(x, y) {
        Helper_1.Helper.log('[gdi] setViewportExtEx: x=' + x + ' y=' + y);
        this.state.vw = x;
        this.state.vh = y;
        this.state._svggroup = null;
    }
    setBrushOrgEx(origin) {
        Helper_1.Helper.log('[gdi] setBrushOrgEx: x=' + origin.x + ' y=' + origin.y);
        this.state.nextbrx = origin.x;
        this.state.nextbry = origin.y;
    }
    saveDC() {
        Helper_1.Helper.log('[gdi] saveDC');
        const prevstate = this.state;
        this.state = new GDIContextState(this.state);
        this.statestack.push(prevstate);
        this.state._svggroup = null;
    }
    restoreDC(saved) {
        Helper_1.Helper.log('[gdi] restoreDC: saved=' + saved);
        if (this.statestack.length > 1) {
            if (saved === -1) {
                const tmp = this.statestack.pop();
                if (typeof tmp !== 'undefined')
                    this.state = tmp;
            }
            else if (saved < -1) {
                throw new Helper_1.EMFJSError('restoreDC: relative restore not implemented');
            }
            else if (saved > 1) {
                throw new Helper_1.EMFJSError('restoreDC: absolute restore not implemented');
            }
        }
        else {
            throw new Helper_1.EMFJSError('No saved contexts');
        }
        this.state._svggroup = null;
    }
    setStretchBltMode(stretchMode) {
        Helper_1.Helper.log('[gdi] setStretchBltMode: stretchMode=' + stretchMode);
    }
    rectangle(rect, rw, rh) {
        if (!this.state.selected.brush || !this.state.selected.pen) {
            Helper_1.Helper.log('[gdi] rectangle: rect=' + rect.toString() + ' with pen undefined' +
                +' and brush: undefined');
            return;
        }
        Helper_1.Helper.log('[gdi] rectangle: rect=' + rect.toString() + ' with pen ' + this.state.selected.pen.toString()
            + ' and brush ' + this.state.selected.brush.toString());
        const bottom = this._todevY(rect.bottom);
        const right = this._todevX(rect.right);
        const top = this._todevY(rect.top);
        const left = this._todevX(rect.left);
        rw = this._todevH(rw);
        rh = this._todevH(rh);
        Helper_1.Helper.log('[gdi] rectangle: TRANSLATED: bottom=' + bottom + ' right=' + right + ' top=' + top
            + ' left=' + left + ' rh=' + rh + ' rw=' + rw);
        this._pushGroup();
        const opts = this._applyOpts(null, true, true, false);
        this._svg.rect(this.state._svggroup, left, top, right - left, bottom - top, rw / 2, rh / 2, opts);
    }
    roundRect(rect, rw, rh) {
        if (!this.state.selected.brush || !this.state.selected.pen) {
            Helper_1.Helper.log('[gdi] rectangle: rect=' + rect.toString() + ' with pen undefined' +
                +' and brush: undefined');
            return;
        }
        Helper_1.Helper.log('[gdi] rectangle: rect=' + rect.toString() + ' with pen ' + this.state.selected.pen.toString()
            + ' and brush ' + this.state.selected.brush.toString());
        const bottom = this._todevY(rect.bottom);
        const right = this._todevX(rect.right);
        const top = this._todevY(rect.top);
        const left = this._todevX(rect.left);
        rw = this._todevH(rw);
        rh = this._todevH(rh);
        Helper_1.Helper.log('[gdi] rectangle: TRANSLATED: bottom=' + bottom + ' right=' + right + ' top=' + top
            + ' left=' + left + ' rh=' + rh + ' rw=' + rw);
        this._pushGroup();
        const opts = this._applyOpts(null, true, true, false);
        this._svg.rect(this.state._svggroup, left, top, right - left, bottom - top, rw / 2, rh / 2, opts);
    }
    lineTo(x, y) {
        if (!this.state.selected.pen) {
            Helper_1.Helper.log('[gdi] lineTo: x=' + x + ' y=' + y + ' with pen: undefined ');
            return;
        }
        Helper_1.Helper.log('[gdi] lineTo: x=' + x + ' y=' + y + ' with pen ' + this.state.selected.pen.toString());
        const toX = this._todevX(x);
        const toY = this._todevY(y);
        const fromX = this._todevX(this.state.x);
        const fromY = this._todevY(this.state.y);
        // Update position
        this.state.x = x;
        this.state.y = y;
        Helper_1.Helper.log('[gdi] lineTo: TRANSLATED: toX=' + toX + ' toY=' + toY + ' fromX=' + fromX + ' fromY=' + fromY);
        this._pushGroup();
        const opts = this._applyOpts(null, true, false, false);
        //this._svg.line(this.state._svggroup, fromX, fromY, toX, toY, opts);
        if (this._svgPath !== null) {
            const point = [[fromX, fromY], [toX, toY]];
            this._svgPath.line(point);
        }
    }
    moveToEx(x, y) {
        Helper_1.Helper.log('[gdi] moveToEx: x=' + x + ' y=' + y);
        this.state.x = x;
        this.state.y = y;
        if (this._svgPath != null) {
            this._svgPath.move(this.state.x, this.state.y);
            Helper_1.Helper.log('[gdi] new path: ' + this._svgPath.path());
        }
    }
    polygon(points, bounds, first) {
        if (!this.state.selected.brush || !this.state.selected.pen) {
            Helper_1.Helper.log('[gdi] polygon: points=' + points + ' with pen: undefined '
                + ' and brush: undefined ');
            return;
        }
        Helper_1.Helper.log('[gdi] polygon: points=' + points + ' with pen ' + this.state.selected.pen.toString()
            + ' and brush ' + this.state.selected.brush.toString());
        const pts = [];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            pts.push([this._todevX(point.x), this._todevY(point.y)]);
        }
        if (first) {
            this._pushGroup();
        }
        const opts = {
            'fill-rule': this.state.polyfillmode === Helper_1.Helper.GDI.PolygonFillMode.ALTERNATE ? 'evenodd' : 'nonzero',
        };
        this._applyOpts(opts, true, true, false);
        this._svg.polygon(this.state._svggroup, pts, opts);
    }
    polyPolygon(polygons, bounds) {
        if (!this.state.selected.brush || !this.state.selected.pen) {
            Helper_1.Helper.log('[gdi] polyPolygon: polygons.length=' + polygons.length
                + ' with pen: undefined ' + ' and brush: undefined ');
            return;
        }
        Helper_1.Helper.log('[gdi] polyPolygon: polygons.length=' + polygons.length
            + ' with pen ' + this.state.selected.pen.toString() + ' and brush ' + this.state.selected.brush.toString());
        const cnt = polygons.length;
        for (let i = 0; i < cnt; i++) {
            this.polygon(polygons[i], bounds, i === 0);
        }
    }
    polyline(isLineTo, points, bounds) {
        if (!this.state.selected.pen) {
            Helper_1.Helper.log('[gdi] polyline: isLineTo=' + isLineTo.toString() + ', points=' + points
                + ', bounds=' + bounds.toString() + ' with pen:undefined');
            return;
        }
        Helper_1.Helper.log('[gdi] polyline: isLineTo=' + isLineTo.toString() + ', points=' + points
            + ', bounds=' + bounds.toString() + ' with pen ' + this.state.selected.pen.toString());
        const pts = [];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            pts.push([this._todevX(point.x), this._todevY(point.y)]);
        }
        if (this._svgPath != null) {
            if (!isLineTo || pts.length === 0) {
                this._svgPath.move(this._todevX(this.state.x), this._todevY(this.state.y));
            }
            else {
                const firstPts = pts[0];
                this._svgPath.move(firstPts[0], firstPts[1]);
            }
            this._svgPath.line(pts);
            Helper_1.Helper.log('[gdi] new path: ' + this._svgPath.path());
        }
        else {
            this._pushGroup();
            const opts = this._applyOpts(null, true, false, false);
            if (isLineTo && points.length > 0) {
                const firstPt = points[0];
                if (firstPt.x !== this.state.x || firstPt.y !== this.state.y) {
                    pts.unshift([this._todevX(this.state.x), this._todevY(this.state.y)]);
                }
            }
            this._svg.polyline(this.state._svggroup, pts, opts);
        }
        if (points.length > 0) {
            const lastPt = points[points.length - 1];
            this.state.x = lastPt.x;
            this.state.y = lastPt.y;
        }
    }
    polybezier(isPolyBezierTo, points, bounds) {
        if (!this.state.selected.pen) {
            Helper_1.Helper.log('[gdi] polybezier: isPolyBezierTo=' + isPolyBezierTo.toString() + ', points=' + points
                + ', bounds=' + bounds.toString() + ' with pen: undefined ');
            return;
        }
        Helper_1.Helper.log('[gdi] polybezier: isPolyBezierTo=' + isPolyBezierTo.toString() + ', points=' + points
            + ', bounds=' + bounds.toString() + ' with pen ' + this.state.selected.pen.toString());
        const pts = [];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            pts.push({ x: this._todevX(point.x), y: this._todevY(point.y) });
        }
        if (this._svgPath != null) {
            if (isPolyBezierTo && pts.length > 0) {
                const firstPts = pts[0];
                const secondPts = pts[1];
                const thirdPts = pts[2];
                //this._svgPath.QBézierCurve(firstPts.x, firstPts.y,secondPts.x,secondPts.y);
                this._svgPath.curveC(firstPts.x, firstPts.y, secondPts.x, secondPts.y, thirdPts.x, thirdPts.y);
                //this._svg.polyline(this.state._svggroup, pts, opts);
            }
            else {
                this._svgPath.move(this._todevX(this.state.x), this._todevY(this.state.y));
            }
            if (pts.length < (isPolyBezierTo ? 3 : 4)) {
                throw new Helper_1.EMFJSError('Not enough points to draw bezier');
            }
            for (let i = isPolyBezierTo ? 1 : 0; i + 3 <= pts.length; i += 3) {
                const cp1 = pts[i];
                const cp2 = pts[i + 1];
                const ep = pts[i + 2];
                Helper_1.Helper.log(`[gdi polybezier_for_loop] cp1: ${cp1} cp2:${cp2} ep:${ep}`);
                this._svgPath.curveC(cp1.x, cp1.y, cp2.x, cp2.y, ep.x, ep.y);
            }
            Helper_1.Helper.log('[gdi] new path: ' + this._svgPath.path());
        }
        else {
            throw new Helper_1.EMFJSError('polybezier not implemented (not a path)');
        }
        if (points.length > 0) {
            const lastPt = points[points.length - 1];
            this.state.x = lastPt.x;
            this.state.y = lastPt.y;
        }
    }
    selectClipPath(rgnMode) {
        Helper_1.Helper.log('[gdi] selectClipPath: rgnMode=0x' + rgnMode.toString(16));
    }
    selectClipRgn(rgnMode, region) {
        Helper_1.Helper.log('[gdi] selectClipRgn: rgnMode=0x' + rgnMode.toString(16));
        if (rgnMode === Helper_1.Helper.GDI.RegionMode.RGN_COPY) {
            this.state.selected.region = region;
            this.state.clip = null;
            this.state.ownclip = false;
        }
        else {
            if (region == null) {
                throw new Helper_1.EMFJSError('No clip region to select');
            }
            throw new Helper_1.EMFJSError('Not implemented: rgnMode=0x' + rgnMode.toString(16));
        }
        this.state._svgclipChanged = true;
    }
    offsetClipRgn(offset) {
        Helper_1.Helper.log('[gdi] offsetClipRgn: offset=' + offset.toString());
        this._getClipRgn().offset(offset.x, offset.y);
    }
    setTextAlign(textAlignmentMode) {
        Helper_1.Helper.log('[gdi] setTextAlign: textAlignmentMode=0x' + textAlignmentMode.toString(16));
        this.state.textalign = textAlignmentMode;
    }
    setMiterLimit(miterLimit) {
        Helper_1.Helper.log('[gdi] setMiterLimit: miterLimit=' + miterLimit);
        this.state.miterlimit = miterLimit;
    }
    setBkMode(bkMode) {
        Helper_1.Helper.log('[gdi] setBkMode: bkMode=0x' + bkMode.toString(16));
        this.state.bkmode = bkMode;
    }
    setBkColor(bkColor) {
        Helper_1.Helper.log('[gdi] setBkColor: bkColor=' + bkColor.toString());
        this.state.bkcolor = bkColor;
        this.state._svgtextbkfilter = null;
    }
    setPolyFillMode(polyFillMode) {
        Helper_1.Helper.log('[gdi] setPolyFillMode: polyFillMode=' + polyFillMode);
        this.state.polyfillmode = polyFillMode;
    }
    createBrush(index, brush) {
        const idx = this._storeObject(brush, index);
        Helper_1.Helper.log('[gdi] createBrush: brush=' + brush.toString() + ' with handle ' + idx);
    }
    createPen(index, pen) {
        const idx = this._storeObject(pen, index);
        Helper_1.Helper.log('[gdi] createPen: pen=' + pen.toString() + ' width handle ' + idx);
    }
    createPenEx(index, pen) {
        const idx = this._storeObject(pen, index);
        Helper_1.Helper.log('[gdi] createPenEx: pen=' + pen.toString() + ' width handle ' + idx);
    }
    selectObject(objIdx, checkType) {
        const obj = this._getObject(objIdx);
        if (obj != null && (checkType == null || obj.type === checkType)) {
            this._selectObject(obj);
            Helper_1.Helper.log('[gdi] selectObject: objIdx=' + objIdx
                + (obj ? ' selected ' + obj.type + ': ' + obj.toString() : '[invalid index]'));
        }
        else {
            Helper_1.Helper.log('[gdi] selectObject: objIdx=' + objIdx
                + (obj ? ' invalid object type: ' + obj.type : '[invalid index]'));
        }
    }
    abortPath() {
        Helper_1.Helper.log('[gdi] abortPath');
        if (this._svgPath != null) {
            this._svgPath = null;
        }
    }
    beginPath() {
        Helper_1.Helper.log('[gdi] beginPath');
        if (this._svgPath != null) {
            this._svgPath = null;
        }
        this._svgPath = this._svg.createPath();
    }
    closeFigure() {
        Helper_1.Helper.log('[gdi] closeFigure');
        if (this._svgPath == null) {
            throw new Helper_1.EMFJSError('No path bracket: cannot close figure');
        }
        this._svgPath.close();
    }
    fillPath(bounds) {
        Helper_1.Helper.log('[gdi] fillPath');
        if (this.state.selected.path == null) {
            throw new Helper_1.EMFJSError('No path selected');
        }
        const selPath = this.state.selected.path;
        const opts = this._applyOpts(null, true, true, false);
        this._svg.path(this.state._svggroup, selPath.svgPath, opts);
        this._pushGroup();
        if (this.state.selected.path)
            this.state.selected.path = null;
    }
    strokePath(bounds) {
        Helper_1.Helper.log('[gdi] strokePath');
        if (this.state.selected.path == null) {
            throw new Helper_1.EMFJSError('No path selected');
        }
        const selPath = this.state.selected.path;
        const opts = this._applyOpts({ fill: 'none' }, true, false, false);
        this._svg.path(this.state._svggroup, selPath.svgPath, opts);
        this._pushGroup();
        this.state.selected.path = null;
    }
    endPath() {
        Helper_1.Helper.log('[gdi] endPath');
        if (this._svgPath == null) {
            throw new Helper_1.EMFJSError('No path bracket: cannot end path');
        }
        this._pushGroup();
        this._selectObject(new Path(this._svgPath));
        this._svgPath = null;
    }
    deleteObject(objIdx) {
        const ret = this._deleteObject(objIdx);
        Helper_1.Helper.log('[gdi] deleteObject: objIdx=' + objIdx + (ret ? ' deleted object' : '[invalid index]'));
    }
    _pushGroup() {
        if (this.state._svggroup == null || this.state._svgclipChanged) {
            this.state._svgclipChanged = false;
            this.state._svgtextbkfilter = null;
            const settings = {
                viewBox: [this.state.vx, this.state.vy, this.state.vw, this.state.vh].join(' '),
                preserveAspectRatio: 'none',
            };
            if (this.state.clip != null) {
                Helper_1.Helper.log('[gdi] new svg x=' + this.state.vx + ' y=' + this.state.vy + ' width=' + this.state.vw
                    + ' height=' + this.state.vh + ' with clipping');
                settings['clip-path'] = 'url(#' + this._getSvgClipPathForRegion(this.state.clip) + ')';
            }
            else {
                Helper_1.Helper.log('[gdi] new svg x=' + this.state.vx + ' y=' + this.state.vy + ' width=' + this.state.vw
                    + ' height=' + this.state.vh + ' without clipping');
            }
            this.state._svggroup = this._svg.svg(this.state._svggroup, this.state.vx, this.state.vy, this.state.vw, this.state.vh, settings);
        }
    }
    _getStockObject(idx) {
        if (idx >= 0x80000000 && idx <= 0x80000011) {
            return _StockObjects[(idx - 0x80000000).toString()];
        }
        else if (idx === Helper_1.Helper.GDI.StockObject.DC_BRUSH) {
            return this.state.selected.brush;
        }
        else if (idx === Helper_1.Helper.GDI.StockObject.DC_PEN) {
            return this.state.selected.pen;
        }
        return null;
    }
    _storeObject(obj, idx) {
        if (!idx) {
            idx = 0;
            while (this.objects[idx.toString()] != null && idx <= 65535) {
                idx++;
            }
            if (idx > 65535) {
                Helper_1.Helper.log('[gdi] Too many objects!');
                return -1;
            }
        }
        this.objects[idx.toString()] = obj;
        return idx;
    }
    _getObject(objIdx) {
        const obj = this.objects[objIdx.toString()];
        if (obj == null) {
            const tmp = this._getStockObject(objIdx);
            if (tmp == null) {
                Helper_1.Helper.log('[gdi] No object with handle ' + objIdx);
            }
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
        const id = Helper_1.Helper._makeUniqueId('c');
        const sclip = this._svg.clipPath(this._getSvgDef(), id, 'userSpaceOnUse');
        if (!region.bounds)
            return;
        if (!region.scans)
            return;
        switch (region.complexity) {
            case 1:
                this._svg.rect(sclip, this._todevX(region.bounds.left), this._todevY(region.bounds.top), this._todevW(region.bounds.right - region.bounds.left), this._todevH(region.bounds.bottom - region.bounds.top), { 'fill': 'black', 'stroke-width': 0 });
                break;
            case 2:
                for (let i = 0; i < region.scans.length; i++) {
                    const scan = region.scans[i];
                    for (let j = 0; j < scan.scanlines.length; j++) {
                        const scanline = scan.scanlines[j];
                        this._svg.rect(sclip, this._todevX(scanline.left), this._todevY(scan.top), this._todevW(scanline.right - scanline.left), this._todevH(scan.bottom - scan.top), { 'fill': 'black', 'stroke-width': 0 });
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
                throw new Helper_1.EMFJSError('Invalid brush style');
        }
        const id = Helper_1.Helper._makeUniqueId('p');
        const spat = this._svg.pattern(this._getSvgDef(), id, this.state.brx, this.state.bry, width, height, { patternUnits: 'userSpaceOnUse' });
        if (img)
            this._svg.image(spat, 0, 0, width, height, img);
        this._svgPatterns[id] = brush;
        return id;
    }
    _selectObject(obj) {
        this.state.selected[obj.type] = obj;
        switch (obj.type) {
            case 'region':
                this.state._svgclipChanged = true;
                break;
            case 'brush':
                this.state.brx = this.state.nextbrx;
                this.state.bry = this.state.nextbry;
                break;
        }
    }
    _deleteObject(objIdx) {
        const obj = this.objects[objIdx.toString()];
        if (obj != null) {
            for (let i = 0; i < this.statestack.length; i++) {
                const state = this.statestack[i];
                if (state.selected[obj.type] === obj) {
                    const tmp = this.defObjects[obj.type];
                    if (tmp)
                        state.selected[obj.type] = tmp.clone();
                }
            }
            delete this.objects[objIdx.toString()];
            return true;
        }
        Helper_1.Helper.log('[gdi] Cannot delete object with invalid handle ' + objIdx);
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
            if (!pen)
                return;
            //if (pen.style !== Helper.GDI.PenStyle.PS_NULL) {
            opts.stroke = '#' + pen.color.toHex(); // TODO: pen style
            opts['stroke-width'] = pen.width;
            opts['stroke-miterlimit'] = this.state.miterlimit;
            opts['stroke-linecap'] = 'round';
            const dotWidth = 1;
            opts['stroke-linejoin'] = 'round';
            const dashWidth = opts['stroke-width'] * 4;
            const dotSpacing = opts['stroke-width'] * 2;
            switch (pen.style) {
                case Helper_1.Helper.GDI.PenStyle.PS_DASH:
                    opts['stroke-dasharray'] = [dashWidth, dotSpacing].toString();
                    break;
                case Helper_1.Helper.GDI.PenStyle.PS_DOT:
                    opts['stroke-dasharray'] = [dotWidth, dotSpacing].toString();
                    break;
                case Helper_1.Helper.GDI.PenStyle.PS_DASHDOT:
                    opts['stroke-dasharray'] = [dashWidth, dotSpacing, dotWidth, dotSpacing].toString();
                    break;
                case Helper_1.Helper.GDI.PenStyle.PS_DASHDOTDOT:
                    opts['stroke-dasharray'] =
                        [dashWidth, dotSpacing, dotWidth, dotSpacing, dotWidth, dotSpacing].toString();
                    break;
            }
        }
        if (useBrush) {
            const brush = this.state.selected.brush;
            if (!brush)
                return;
            switch (brush.style) {
                case Helper_1.Helper.GDI.BrushStyle.BS_SOLID:
                    opts.fill = '#' + brush.color.toHex();
                    break;
                case Helper_1.Helper.GDI.BrushStyle.BS_PATTERN:
                case Helper_1.Helper.GDI.BrushStyle.BS_DIBPATTERNPT:
                    opts.fill = 'url(#' + this._getSvgPatternForBrush(brush) + ')';
                    break;
                case Helper_1.Helper.GDI.BrushStyle.BS_NULL:
                    opts.fill = 'none';
                    break;
                default:
                    Helper_1.Helper.log('[gdi] unsupported brush style: ' + brush.style);
                    opts.fill = 'none';
                    break;
            }
        }
        if (useFont) {
            const font = this.state.selected.font;
            if (!font)
                return;
            opts['font-family'] = font.facename;
            opts['font-size'] = Math.abs(font.height);
            opts.fill = '#' + this.state.textcolor.toHex();
        }
        return opts;
    }
}
exports.GDIContext = GDIContext;
