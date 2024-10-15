"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */
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
exports.EMFRecords = void 0;
const Helper_1 = require("./Helper");
const Primitives_1 = require("./Primitives");
const Region_1 = require("./Region");
const Style_1 = require("./Style");
class EmfHeader {
    constructor(reader, headerSize) {
        this.displayDevCxUm = 0;
        this.displayDevCyUm = 0;
        const recordStart = reader.pos - 8;
        this.size = headerSize;
        this.bounds = new Primitives_1.RectL(reader);
        this.frame = new Primitives_1.RectL(reader);
        if (reader.readUint32() !== Helper_1.Helper.GDI.FormatSignature.ENHMETA_SIGNATURE) {
            throw new Helper_1.EMFJSError('Invalid header signature');
        }
        reader.skip(4); // version
        reader.skip(4); // bytes (size of metafile)
        reader.skip(4); // number of records
        reader.skip(2); // number of handles
        reader.skip(2); // reserved
        const descriptionLen = reader.readUint32();
        const descriptionOff = reader.readUint32();
        this.nPalEntries = reader.readUint32();
        this.refDevCx = reader.readUint32();
        this.refDevCy = reader.readUint32();
        this.refDevCxMm = reader.readUint32();
        this.refDevCyMm = reader.readUint32();
        let hdrSize = headerSize;
        if (descriptionLen > 0) {
            if (descriptionOff < 88) {
                throw new Helper_1.EMFJSError('Invalid header description offset');
            }
            hdrSize = descriptionOff + (descriptionLen * 2);
            if (hdrSize > headerSize) {
                throw new Helper_1.EMFJSError('Invalid header description length');
            }
            const prevPos = reader.pos;
            reader.seek(recordStart + descriptionOff);
            this.description = reader.readFixedSizeUnicodeString(descriptionLen);
            reader.seek(prevPos);
        }
        else {
            this.description = '';
        }
        Helper_1.Helper.log(`[EMFHEADER] headersize: ${hdrSize}`);
        if (hdrSize >= 100 && hdrSize <= 108) {
            // We have a EmfMetafileHeaderExtension1 record
            const pixelFormatSize = reader.readUint32();
            const pixelFormatOff = reader.readUint32();
            var reader2 = reader;
            const haveOpenGl = reader.readUint32();
            Helper_1.Helper.log(`[EMFHEADER] pixelFormatSize: ${pixelFormatSize} pixelFormatOff: ${pixelFormatOff} openGL: 0x${haveOpenGl.toString(16)}`);
            if (haveOpenGl !== 0) {
                Helper_1.Helper.log('This class has openGL extension');
            }
            if (pixelFormatOff !== 0) {
                if (pixelFormatOff < 100 || pixelFormatOff < hdrSize) {
                    throw new Helper_1.EMFJSError('Invalid pixel format offset');
                }
                hdrSize = pixelFormatOff + pixelFormatSize;
                if (hdrSize > headerSize) {
                    throw new Helper_1.EMFJSError('Invalid pixel format size');
                }
                // TODO: read pixel format blob
            }
        }
        if (hdrSize > 108) {
            // We have a EmfMetafileHeaderExtension2 record
            this.displayDevCxUm = reader.readUint32(); // in micrometers
            this.displayDevCyUm = reader.readUint32(); // in micrometers
            Helper_1.Helper.log(`[EMFHEADER] displayDevXyUM: ${this.displayDevCxUm / 1000}displayDevCyUm: ${this.displayDevCyUm / 1000}`);
        }
    }
    toString() {
        return '{bounds: ' + this.bounds.toString() + ', frame: ' + this.frame.toString()
            + ', description: ' + this.description + '}';
    }
}
class EMFRecords {
    constructor(reader, first) {
        this._records = [];
        this._header = new EmfHeader(reader, first);
        let all = false;
        let curpos = first;
        main_loop: while (!all) {
            reader.seek(curpos);
            const type = reader.readUint32();
            const size = reader.readUint32();
            if (size < 8) {
                throw new Helper_1.EMFJSError('Invalid record size');
            }
            switch (type) {
                case Helper_1.Helper.GDI.RecordType.EMR_EOF:
                    all = true;
                    break main_loop;
                case Helper_1.Helper.GDI.RecordType.EMR_SETMAPMODE: {
                    const mapMode = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.setMapMode(mapMode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETWINDOWORGEX: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.setWindowOrgEx(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETWINDOWEXTEX: {
                    const x = reader.readUint32();
                    const y = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setWindowExtEx(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETVIEWPORTORGEX: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.setViewportOrgEx(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETVIEWPORTEXTEX: {
                    const x = reader.readUint32();
                    const y = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setViewportExtEx(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SAVEDC: {
                    this._records.push((gdi) => {
                        gdi.saveDC();
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_RESTOREDC: {
                    const saved = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.restoreDC(saved);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETBKMODE: {
                    const bkMode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setBkMode(bkMode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETBKCOLOR: {
                    const bkColor = new Style_1.ColorRef(reader);
                    this._records.push((gdi) => {
                        gdi.setBkColor(bkColor);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_CREATEBRUSHINDIRECT: {
                    const index = reader.readUint32();
                    const brush = new Style_1.Brush(reader);
                    this._records.push((gdi) => {
                        gdi.createBrush(index, brush);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_CREATEPEN: {
                    const index = reader.readUint32();
                    const pen = new Style_1.Pen(reader, null);
                    if (pen.width === 0)
                        pen.width = 1;
                    this._records.push((gdi) => {
                        gdi.createPen(index, pen);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_EXTCREATEPEN: {
                    const index = reader.readUint32();
                    const offBmi = reader.readUint32();
                    const cbBmi = reader.readUint32();
                    const offBits = reader.readUint32();
                    const cbBits = reader.readUint32();
                    const pen = new Style_1.Pen(reader, {
                        header: {
                            off: offBmi,
                            size: cbBmi,
                        },
                        data: {
                            off: offBits,
                            size: cbBits,
                        },
                    });
                    this._records.push((gdi) => {
                        gdi.createPen(index, pen);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SELECTOBJECT: {
                    const idx = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.selectObject(idx, null);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_DELETEOBJECT: {
                    const idx = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.deleteObject(idx);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_RECTANGLE: {
                    const rect = new Primitives_1.RectL(reader);
                    this._records.push((gdi) => {
                        gdi.rectangle(rect, 0, 0);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_ROUNDRECT: {
                    const rect = new Primitives_1.RectL(reader);
                    const corner = new Primitives_1.SizeL(reader);
                    this._records.push((gdi) => {
                        gdi.roundRect(rect, corner.cx, corner.cy);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_LINETO: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.lineTo(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_MOVETOEX: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.moveToEx(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_POLYGON:
                case Helper_1.Helper.GDI.RecordType.EMR_POLYGON16: {
                    const isSmall = (type === Helper_1.Helper.GDI.RecordType.EMR_POLYGON16);
                    const bounds = new Primitives_1.RectL(reader);
                    let cnt = reader.readUint32();
                    const points = [];
                    while (cnt > 0) {
                        points.push(isSmall ? new Primitives_1.PointS(reader) : new Primitives_1.PointL(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polygon(points, bounds, true);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_POLYPOLYGON:
                case Helper_1.Helper.GDI.RecordType.EMR_POLYPOLYGON16: {
                    const isSmall = (type === Helper_1.Helper.GDI.RecordType.EMR_POLYPOLYGON16);
                    const bounds = new Primitives_1.RectL(reader);
                    const polyCnt = reader.readUint32();
                    reader.skip(4); // count
                    const polygonsPtCnts = [];
                    for (let i = 0; i < polyCnt; i++) {
                        polygonsPtCnts.push(reader.readUint32());
                    }
                    const polygons = [];
                    for (let i = 0; i < polyCnt; i++) {
                        const ptCnt = polygonsPtCnts[i];
                        const p = [];
                        for (let ip = 0; ip < ptCnt; ip++) {
                            p.push(isSmall ? new Primitives_1.PointS(reader) : new Primitives_1.PointL(reader));
                        }
                        polygons.push(p);
                    }
                    this._records.push((gdi) => {
                        gdi.polyPolygon(polygons, bounds);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETPOLYFILLMODE: {
                    const polyfillmode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setPolyFillMode(polyfillmode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_POLYLINE16:
                case Helper_1.Helper.GDI.RecordType.EMR_POLYLINETO16: {
                    const isLineTo = (type === Helper_1.Helper.GDI.RecordType.EMR_POLYLINETO16);
                    const bounds = new Primitives_1.RectL(reader);
                    let cnt = reader.readUint32();
                    const points = [];
                    while (cnt > 0) {
                        points.push(new Primitives_1.PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polyline(isLineTo, points, bounds);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_POLYBEZIER:
                case Helper_1.Helper.GDI.RecordType.EMR_POLYBEZIERTO: {
                    const isPolyBezierTo = (type === Helper_1.Helper.GDI.RecordType.EMR_POLYBEZIERTO);
                    const bounds = new Primitives_1.RectL(reader);
                    let cnt = reader.readUint32();
                    const points = [];
                    while (cnt > 0) {
                        points.push(new Primitives_1.PointL(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polybezier(isPolyBezierTo, points, bounds);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_POLYBEZIER16: {
                    const bounds = new Primitives_1.RectL(reader);
                    const start = new Primitives_1.PointL(reader);
                    let cnt = reader.readUint32();
                    const points = [start];
                    while (cnt > 0) {
                        points.push(new Primitives_1.PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polybezier(false, points, bounds);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_POLYBEZIERTO16: {
                    const bounds = new Primitives_1.RectL(reader);
                    let cnt = reader.readUint32();
                    const points = [];
                    while (cnt > 0) {
                        points.push(new Primitives_1.PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polybezier(true, points, bounds);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETTEXTALIGN: {
                    const textAlign = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setTextAlign(textAlign);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETSTRETCHBLTMODE: {
                    const stretchMode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setStretchBltMode(stretchMode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETBRUSHORGEX: {
                    const origin = new Primitives_1.PointL(reader);
                    this._records.push((gdi) => {
                        gdi.setBrushOrgEx(origin);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_BEGINPATH: {
                    this._records.push((gdi) => {
                        gdi.beginPath();
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_ENDPATH: {
                    this._records.push((gdi) => {
                        gdi.endPath();
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_ABORTPATH: {
                    this._records.push((gdi) => {
                        gdi.abortPath();
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_CLOSEFIGURE: {
                    this._records.push((gdi) => {
                        gdi.closeFigure();
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_FILLPATH: {
                    const bounds = new Primitives_1.RectL(reader);
                    this._records.push((gdi) => {
                        gdi.fillPath(bounds);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_STROKEPATH: {
                    const bounds = new Primitives_1.RectL(reader);
                    this._records.push((gdi) => {
                        gdi.strokePath(bounds);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SELECTCLIPPATH: {
                    const rgnMode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.selectClipPath(rgnMode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_EXTSELECTCLIPRGN: {
                    reader.skip(4);
                    const rgnMode = reader.readUint32();
                    const region = rgnMode !== Helper_1.Helper.GDI.RegionMode.RGN_COPY ? new Region_1.Region(reader) : null;
                    this._records.push((gdi) => {
                        if (region)
                            gdi.selectClipRgn(rgnMode, region);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_OFFSETCLIPRGN: {
                    const offset = new Primitives_1.PointL(reader);
                    this._records.push((gdi) => {
                        gdi.offsetClipRgn(offset);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_SETMITERLIMIT: {
                    const miterLimit = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setMiterLimit(miterLimit);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.EMR_POLYLINE:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYLINE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_POLYLINETO:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYLINETO');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_POLYPOLYLINE:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYPOLYLINE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETPIXELV:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETPIXELV');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETMAPPERFLAGS:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETMAPPERFLAGS');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETROP2:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETROP2');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETCOLORADJUSTMENT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETCOLORADJUSTMENT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETTEXTCOLOR:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETTEXTCOLOR');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETMETARGN:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETMEARGH');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_EXCLUDECLIPRECT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETECLUDECLIPRECT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_INTERSECTCLIPRECT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETINTERSECTCLIPRECT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SCALEVIEWPORTEXTEX:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETSCALEVIEWPORTEXTEX');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SCALEWINDOWEXTEX:
                    Helper_1.Helper.log('[EMFRecords] EMR_SCALEWINDOWEXTEX');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETWORLDTRANSFORM:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETWORLDTRANSFORM');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_MODIFYWORLDTRANSFORM:
                    Helper_1.Helper.log('[EMFRecords] EMR_MODIFYWORLDTRANSFORM');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_ANGLEARC:
                    Helper_1.Helper.log('[EMFRecords] EMR_ANGLEARC');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_ELLIPSE:
                    Helper_1.Helper.log('[EMFRecords] EMR_ELLIPSE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_ARC:
                    Helper_1.Helper.log('[EMFRecords] EMR_ARC');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_CHORD:
                    Helper_1.Helper.log('[EMFRecords] EMR_CHORD');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_PIE:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETPIE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SELECTPALETTE:
                    Helper_1.Helper.log('[EMFRecords] EMR_SELECTPLATTE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_CREATEPALETTE:
                    Helper_1.Helper.log('[EMFRecords] EMR_CREATEPALETTE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETPALETTEENTRIES:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETPALETTEENTRIES');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_RESIZEPALETTE:
                    Helper_1.Helper.log('[EMFRecords] EMR_RESIZEPALETTE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_REALIZEPALETTE:
                    Helper_1.Helper.log('[EMFRecords] EMR_REALIZEPALETTE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_EXTFLOODFILL:
                    Helper_1.Helper.log('[EMFRecords] EMR_EXTFLOODFILL');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_ARCTO:
                    Helper_1.Helper.log('[EMFRecords] EMR_ARCTO');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_POLYDRAW:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYDRAW');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETARCDIRECTION:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETARCDIRECTION');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_STROKEANDFILLPATH:
                    Helper_1.Helper.log('[EMFRecords] EMR_STROKEANDFILLPATH');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_FLATTENPATH:
                    Helper_1.Helper.log('[EMFRecords] EMR_FLATTENPATH');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_WIDENPATH:
                    Helper_1.Helper.log('[EMFRecords] EMR_WIDENPATH');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_COMMENT:
                    Helper_1.Helper.log('[EMFRecords] EMR_COMMENT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_FILLRGN:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETFILLRGN');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_FRAMERGN:
                    Helper_1.Helper.log('[EMFRecords] EMR_FRAMERGN');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_INVERTRGN:
                    Helper_1.Helper.log('[EMFRecords] EMR_INVERTRGN');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_PAINTRGN:
                    Helper_1.Helper.log('[EMFRecords] EMR_PAINTRGN');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_BITBLT:
                    Helper_1.Helper.log('[EMFRecords] EMR_BITBLT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_STRETCHBLT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SCRETCHBLT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_MASKBLT:
                    Helper_1.Helper.log('[EMFRecords] EMR_MASKBLT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_PLGBLT:
                    Helper_1.Helper.log('[EMFRecords] EMR_PLBLT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETDIBITSTODEVICE:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETDIBITSTODEVICE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_STRETCHDIBITS:
                    Helper_1.Helper.log('[EMFRecords] EMR_STRETCHDIBITS');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_EXTCREATEFONTINDIRECTW:
                    Helper_1.Helper.log('[EMFRecords] EMR_EXTCREATEFONTINIRECTW');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_EXTTEXTOUTA:
                    Helper_1.Helper.log('[EMFRecords] EMR_EXTTEXTOUtA');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_EXTTEXTOUTW:
                    Helper_1.Helper.log('[EMFRecords] EMR_EXTTEXTOUTw');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_POLYPOLYLINE16:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYPOLYLINE16');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_POLYDRAW16:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYDRAW16');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_CREATEMONOBRUSH:
                    Helper_1.Helper.log('[EMFRecords] EMR_CREATEMONOBRUSH');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_CREATEDIBPATTERNBRUSHPT:
                    Helper_1.Helper.log('[EMFRecords] EMR_CREATEDIBPATTERNBRUSHPT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_POLYTEXTOUTA:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYTEXTOUTA');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_POLYTEXTOUTW:
                    Helper_1.Helper.log('[EMFRecords] EMR_POLYTEXTOUTW');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETICMMODE:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETICMMODE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_CREATECOLORSPACE:
                    Helper_1.Helper.log('[EMFRecords] EMR_CREATECOLORSPACE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETCOLORSPACE:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETCOLORSPACE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_DELETECOLORSPACE:
                    Helper_1.Helper.log('[EMFRecords] EMR_DELETECOLORSPACE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_GLSRECORD:
                    Helper_1.Helper.log('[EMFRecords] EMR_GLSRECORD');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_GLSBOUNDEDRECORD:
                    Helper_1.Helper.log('[EMFRecords] EMR_GLSBOUNDEDRECORD');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_PIXELFORMAT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETPIXELFORMAT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_DRAWESCAPE:
                    Helper_1.Helper.log('[EMFRecords] EMR_DRAWESCAPE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_EXTESCAPE:
                    Helper_1.Helper.log('[EMFRecords] EMR_EXTESCAPE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SMALLTEXTOUT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SMALLTEXTOUT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_FORCEUFIMAPPING:
                    Helper_1.Helper.log('[EMFRecords] EMR_FORCEUFIMAPPING');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_NAMEDESCAPE:
                    Helper_1.Helper.log('[EMFRecords] EMR_NAMEDESCAPE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_COLORCORRECTPALETTE:
                    Helper_1.Helper.log('[EMFRecords] EMR_COLORCORRECTPALETTE');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETICMPROFILEA:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETPICMPROFILEA');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETICMPROFILEW:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETICMPROFILEW');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_ALPHABLEND:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETALPHABLEND');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETLAYOUT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETLAYOUT');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_TRANSPARENTBLT:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETPIXELV');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_GRADIENTFILL:
                    Helper_1.Helper.log('[EMFRecords] EMR_GRADIENTFILL');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETLINKEDUFIS:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETLINKEDUFIS');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_SETTEXTJUSTIFICATION:
                    Helper_1.Helper.log('[EMFRecords] EMR_SETTEXTJUSTIFICATION');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_COLORMATCHTOTARGETW:
                    Helper_1.Helper.log('[EMFRecords] EMR_COLORMATCHTOTARGETW');
                    break;
                case Helper_1.Helper.GDI.RecordType.EMR_CREATECOLORSPACEW:
                default: {
                    let recordName = 'UNKNOWN';
                    for (const name in Helper_1.Helper.GDI.RecordType) {
                        const recordTypes = Helper_1.Helper.GDI.RecordType;
                        if (recordTypes[name] === type) {
                            recordName = name;
                            break;
                        }
                    }
                    Helper_1.Helper.log('[EMFRecords] ' + recordName + ' record (0x' + type.toString(16) + ') at offset 0x'
                        + curpos.toString(16) + ' with ' + size + ' bytes');
                    break;
                }
            }
            curpos += size;
        }
        if (!all) {
            throw new Helper_1.EMFJSError('Could not read all records');
        }
    }
    play(gdi) {
        const len = this._records.length;
        for (let i = 0; i < len; i++) {
            this._records[i](gdi);
        }
    }
}
exports.EMFRecords = EMFRecords;
