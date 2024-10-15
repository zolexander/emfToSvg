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
exports.WMFRecords = void 0;
const Bitmap_1 = require("./Bitmap");
const Blob_1 = require("./Blob");
const Helper_1 = require("./Helper");
const Primitives_1 = require("./Primitives");
const Region_1 = require("./Region");
const Style_1 = require("./Style");
class WMFRecords {
    constructor(reader, first) {
        this._records = [];
        let all = false;
        let curpos = first;
        main_loop: while (!all) {
            reader.seek(curpos);
            const size = reader.readUint32();
            if (size < 3) {
                throw new Helper_1.WMFJSError("Invalid record size");
            }
            const type = reader.readUint16();
            switch (type) {
                case Helper_1.Helper.GDI.RecordType.META_EOF:
                    all = true;
                    break main_loop;
                case Helper_1.Helper.GDI.RecordType.META_SETMAPMODE: {
                    const mapMode = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.setMapMode(mapMode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETWINDOWORG: {
                    const y = reader.readInt16();
                    const x = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.setWindowOrg(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETWINDOWEXT: {
                    const y = reader.readInt16();
                    const x = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.setWindowExt(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_OFFSETWINDOWORG: {
                    const offY = reader.readInt16();
                    const offX = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.offsetWindowOrg(offX, offY);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETVIEWPORTORG: {
                    const y = reader.readInt16();
                    const x = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.setViewportOrg(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETVIEWPORTEXT: {
                    const y = reader.readInt16();
                    const x = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.setViewportExt(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_OFFSETVIEWPORTORG: {
                    const offY = reader.readInt16();
                    const offX = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.offsetViewportOrg(offX, offY);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SAVEDC: {
                    this._records.push((gdi) => {
                        gdi.saveDC();
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_RESTOREDC: {
                    const saved = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.restoreDC(saved);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETSTRETCHBLTMODE: {
                    const stretchMode = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.setStretchBltMode(stretchMode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_DIBBITBLT: {
                    const haveSrcDib = ((type >> 8) + 3 !== size);
                    const rasterOp = reader.readUint16() | (reader.readUint16() << 16);
                    const srcY = reader.readInt16();
                    const srcX = reader.readInt16();
                    if (!haveSrcDib) {
                        // ignore reserved field
                        reader.skip(2);
                    }
                    const height = reader.readInt16();
                    const width = reader.readInt16();
                    const destY = reader.readInt16();
                    const destX = reader.readInt16();
                    if (haveSrcDib) {
                        const datalength = size * 2 - (reader.pos - curpos);
                        const dib = new Bitmap_1.DIBitmap(reader, datalength);
                        this._records.push((gdi) => {
                            gdi.dibBits(srcX, srcY, destX, destY, width, height, rasterOp, dib);
                        });
                    }
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_DIBSTRETCHBLT: {
                    const haveSrcDib = ((type >> 8) + 3 !== size);
                    const rasterOp = reader.readUint16() | (reader.readUint16() << 16);
                    const srcH = reader.readInt16();
                    const srcW = reader.readInt16();
                    const srcY = reader.readInt16();
                    const srcX = reader.readInt16();
                    const destH = reader.readInt16();
                    const destW = reader.readInt16();
                    const destY = reader.readInt16();
                    const destX = reader.readInt16();
                    const datalength = size * 2 - (reader.pos - curpos);
                    const dib = new Bitmap_1.DIBitmap(reader, datalength);
                    this._records.push((gdi) => {
                        gdi.stretchDibBits(srcX, srcY, srcW, srcH, destX, destY, destW, destH, rasterOp, dib);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_STRETCHDIB: {
                    const rasterOp = reader.readUint16() | (reader.readUint16() << 16);
                    const colorUsage = reader.readInt16();
                    const srcH = reader.readInt16();
                    const srcW = reader.readInt16();
                    const srcY = reader.readInt16();
                    const srcX = reader.readInt16();
                    const destH = reader.readInt16();
                    const destW = reader.readInt16();
                    const destY = reader.readInt16();
                    const destX = reader.readInt16();
                    const datalength = size * 2 - (reader.pos - curpos);
                    const dib = new Bitmap_1.DIBitmap(reader, datalength);
                    this._records.push((gdi) => {
                        gdi.stretchDib(srcX, srcY, srcW, srcH, destX, destY, destW, destH, rasterOp, colorUsage, dib);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_ESCAPE: {
                    const func = reader.readUint16();
                    const count = reader.readUint16();
                    const offset = reader.pos;
                    const blob = new Blob_1.Blob(reader, offset);
                    this._records.push((gdi) => {
                        gdi.escape(func, blob, offset, count);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETTEXTALIGN: {
                    const textAlign = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.setTextAlign(textAlign);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETBKMODE: {
                    const bkMode = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.setBkMode(bkMode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETTEXTCOLOR: {
                    const textColor = new Style_1.ColorRef(reader);
                    this._records.push((gdi) => {
                        gdi.setTextColor(textColor);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETBKCOLOR: {
                    const bkColor = new Style_1.ColorRef(reader);
                    this._records.push((gdi) => {
                        gdi.setBkColor(bkColor);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_CREATEBRUSHINDIRECT: {
                    const datalength = size * 2 - (reader.pos - curpos);
                    const brush = new Style_1.Brush(reader, datalength, false);
                    this._records.push((gdi) => {
                        gdi.createBrush(brush);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_DIBCREATEPATTERNBRUSH: {
                    const datalength = size * 2 - (reader.pos - curpos);
                    const brush = new Style_1.Brush(reader, datalength, true);
                    this._records.push((gdi) => {
                        gdi.createBrush(brush);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_CREATEPENINDIRECT: {
                    const pen = new Style_1.Pen(reader);
                    this._records.push((gdi) => {
                        gdi.createPen(pen);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_CREATEFONTINDIRECT: {
                    const datalength = size * 2 - (reader.pos - curpos);
                    const font = new Style_1.Font(reader, datalength);
                    this._records.push((gdi) => {
                        gdi.createFont(font);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SELECTOBJECT: {
                    const idx = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.selectObject(idx, null);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SELECTPALETTE: {
                    const idx = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.selectObject(idx, "palette");
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SELECTCLIPREGION: {
                    const idx = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.selectObject(idx, "region");
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_DELETEOBJECT: {
                    const idx = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.deleteObject(idx);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_RECTANGLE: {
                    const rect = new Primitives_1.Rect(reader);
                    this._records.push((gdi) => {
                        gdi.rectangle(rect, 0, 0);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_ROUNDRECT: {
                    const rh = reader.readInt16();
                    const rw = reader.readInt16();
                    const rect = new Primitives_1.Rect(reader);
                    this._records.push((gdi) => {
                        gdi.rectangle(rect, rw, rh);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_LINETO: {
                    const y = reader.readInt16();
                    const x = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.lineTo(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_MOVETO: {
                    const y = reader.readInt16();
                    const x = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.moveTo(x, y);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_TEXTOUT: {
                    const len = reader.readInt16();
                    if (len > 0) {
                        const text = reader.readString(len);
                        reader.skip(len % 2);
                        const y = reader.readInt16();
                        const x = reader.readInt16();
                        this._records.push((gdi) => {
                            gdi.textOut(x, y, text);
                        });
                    }
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_EXTTEXTOUT: {
                    const y = reader.readInt16();
                    const x = reader.readInt16();
                    const len = reader.readInt16();
                    const fwOpts = reader.readUint16();
                    let hasRect = null;
                    let hasDx = null;
                    if (size * 2 === 14 + len + len % 2) {
                        hasRect = false;
                        hasDx = false;
                    }
                    if (size * 2 === 14 + 8 + len + len % 2) {
                        hasRect = true;
                        hasDx = false;
                    }
                    if (size * 2 === 14 + len + len % 2 + len * 2) {
                        hasRect = false;
                        hasDx = true;
                    }
                    if (size * 2 === 14 + 8 + len + len % 2 + len * 2) {
                        hasRect = true;
                        hasDx = true;
                    }
                    const rect = hasRect ? new Primitives_1.Rect(reader) : null;
                    if (len > 0) {
                        const text = reader.readString(len);
                        reader.skip(len % 2);
                        const dx = [];
                        if (hasDx) {
                            for (let i = 0; i < text.length; i++) {
                                dx.push(reader.readInt16());
                            }
                        }
                        this._records.push((gdi) => {
                            if (rect)
                                gdi.extTextOut(x, y, text, fwOpts, rect, dx);
                        });
                    }
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_EXCLUDECLIPRECT: {
                    const rect = new Primitives_1.Rect(reader);
                    this._records.push((gdi) => {
                        gdi.excludeClipRect(rect);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_INTERSECTCLIPRECT: {
                    const rect = new Primitives_1.Rect(reader);
                    this._records.push((gdi) => {
                        gdi.intersectClipRect(rect);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_POLYGON: {
                    let cnt = reader.readInt16();
                    const points = [];
                    while (cnt > 0) {
                        points.push(new Primitives_1.PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polygon(points, true);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_SETPOLYFILLMODE: {
                    const polyfillmode = reader.readUint16();
                    this._records.push((gdi) => {
                        gdi.setPolyFillMode(polyfillmode);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_POLYPOLYGON: {
                    const cnt = reader.readUint16();
                    const polygonsPtCnts = [];
                    for (let i = 0; i < cnt; i++) {
                        polygonsPtCnts.push(reader.readUint16());
                    }
                    const polygons = [];
                    for (let i = 0; i < cnt; i++) {
                        const ptCnt = polygonsPtCnts[i];
                        const p = [];
                        for (let ip = 0; ip < ptCnt; ip++) {
                            p.push(new Primitives_1.PointS(reader));
                        }
                        polygons.push(p);
                    }
                    this._records.push((gdi) => {
                        gdi.polyPolygon(polygons);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_POLYLINE: {
                    let cnt = reader.readInt16();
                    const points = [];
                    while (cnt > 0) {
                        points.push(new Primitives_1.PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polyline(points);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_ELLIPSE: {
                    const rect = new Primitives_1.Rect(reader);
                    this._records.push((gdi) => {
                        gdi.ellipse(rect);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_CREATEPALETTE: {
                    const palette = new Style_1.Palette(reader);
                    this._records.push((gdi) => {
                        gdi.createPalette(palette);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_CREATEREGION: {
                    const region = new Region_1.Region(reader);
                    this._records.push((gdi) => {
                        gdi.createRegion(region);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_CREATEPATTERNBRUSH: {
                    const datalength = size * 2 - (reader.pos - curpos);
                    const patternBitmap = new Bitmap_1.PatternBitmap16(reader, datalength);
                    const brush = new Style_1.Brush(reader, datalength, patternBitmap);
                    this._records.push((gdi) => {
                        gdi.createPatternBrush(brush);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_OFFSETCLIPRGN: {
                    const offY = reader.readInt16();
                    const offX = reader.readInt16();
                    this._records.push((gdi) => {
                        gdi.offsetClipRgn(offX, offY);
                    });
                    break;
                }
                case Helper_1.Helper.GDI.RecordType.META_REALIZEPALETTE:
                case Helper_1.Helper.GDI.RecordType.META_SETPALENTRIES:
                case Helper_1.Helper.GDI.RecordType.META_SETROP2:
                case Helper_1.Helper.GDI.RecordType.META_SETRELABS:
                case Helper_1.Helper.GDI.RecordType.META_SETTEXTCHAREXTRA:
                case Helper_1.Helper.GDI.RecordType.META_RESIZEPALETTE:
                case Helper_1.Helper.GDI.RecordType.META_SETLAYOUT:
                case Helper_1.Helper.GDI.RecordType.META_FILLREGION:
                case Helper_1.Helper.GDI.RecordType.META_SETMAPPERFLAGS:
                case Helper_1.Helper.GDI.RecordType.META_SETTEXTJUSTIFICATION:
                case Helper_1.Helper.GDI.RecordType.META_SCALEWINDOWEXT:
                case Helper_1.Helper.GDI.RecordType.META_SCALEVIEWPORTEXT:
                case Helper_1.Helper.GDI.RecordType.META_FLOODFILL:
                case Helper_1.Helper.GDI.RecordType.META_FRAMEREGION:
                case Helper_1.Helper.GDI.RecordType.META_ANIMATEPALETTE:
                case Helper_1.Helper.GDI.RecordType.META_EXTFLOODFILL:
                case Helper_1.Helper.GDI.RecordType.META_SETPIXEL:
                case Helper_1.Helper.GDI.RecordType.META_PATBLT:
                case Helper_1.Helper.GDI.RecordType.META_PIE:
                case Helper_1.Helper.GDI.RecordType.META_STRETCHBLT:
                case Helper_1.Helper.GDI.RecordType.META_INVERTREGION:
                case Helper_1.Helper.GDI.RecordType.META_PAINTREGION:
                case Helper_1.Helper.GDI.RecordType.META_ARC:
                case Helper_1.Helper.GDI.RecordType.META_CHORD:
                case Helper_1.Helper.GDI.RecordType.META_BITBLT:
                case Helper_1.Helper.GDI.RecordType.META_SETDIBTODEV:
                default: {
                    let recordName = "UNKNOWN";
                    for (const name in Helper_1.Helper.GDI.RecordType) {
                        const recordTypes = Helper_1.Helper.GDI.RecordType;
                        if (recordTypes[name] === type) {
                            recordName = name;
                            break;
                        }
                    }
                    Helper_1.Helper.log("[WMF] " + recordName + " record (0x" + type.toString(16) + ") at offset 0x"
                        + curpos.toString(16) + " with " + (size * 2) + " bytes");
                    break;
                }
            }
            curpos += size * 2;
        }
        if (!all) {
            throw new Helper_1.WMFJSError("Could not read all records");
        }
    }
    play(gdi) {
        const len = this._records.length;
        for (let i = 0; i < len; i++) {
            this._records[i](gdi);
        }
    }
}
exports.WMFRecords = WMFRecords;
