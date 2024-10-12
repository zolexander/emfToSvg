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

import { Blob } from "./Blob";
import { GDIContext } from "./GDIContext";
import { EMFJSError, Helper } from "./Helper";
import { PointL, PointS, RectL, SizeL } from "./Primitives";
import { Region } from "./Region";
import { Brush, ColorRef, Pen } from "./Style";

class EmfHeader {
    private size: number;
    public bounds: RectL;
    private frame: RectL;
    private nPalEntries: number;
    private refDevCx: number;
    private refDevCy: number;
    private refDevCxMm: number;
    private refDevCyMm: number;
    private description: string;
    public displayDevCxUm: number = 0;
    public displayDevCyUm: number = 0;

    constructor(reader: Blob, headerSize: number) {
        const recordStart = reader.pos - 8;

        this.size = headerSize;
        this.bounds = new RectL(reader);
        this.frame = new RectL(reader);
        if (reader.readUint32() !== Helper.GDI.FormatSignature.ENHMETA_SIGNATURE) {
            throw new EMFJSError("Invalid header signature");
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
                throw new EMFJSError("Invalid header description offset");
            }

            hdrSize = descriptionOff + (descriptionLen * 2);
            if (hdrSize > headerSize) {
                throw new EMFJSError("Invalid header description length");
            }

            const prevPos = reader.pos;
            reader.seek(recordStart + descriptionOff);
            this.description = reader.readFixedSizeUnicodeString(descriptionLen);
            reader.seek(prevPos);
        } else {
            this.description = "";
        }
        Helper.log(`[EMFHEADER] headersize: ${hdrSize}`);
        if (hdrSize >= 100 && hdrSize <=108) {

            // We have a EmfMetafileHeaderExtension1 record
            const pixelFormatSize = reader.readUint32();
            const pixelFormatOff = reader.readUint32();
            var  reader2 = reader;
            const haveOpenGl = reader.readUint32();
            Helper.log(`[EMFHEADER] pixelFormatSize: ${pixelFormatSize} pixelFormatOff: ${pixelFormatOff} openGL: 0x${haveOpenGl.toString(16)}`);
            if (haveOpenGl !== 0) {
               Helper.log("This class has openGL extension")
            }
   
            if (pixelFormatOff !== 0) {
                if (pixelFormatOff < 100 || pixelFormatOff < hdrSize) {
                    throw new EMFJSError("Invalid pixel format offset");
                }

                hdrSize = pixelFormatOff + pixelFormatSize;
                if (hdrSize > headerSize) {
                    throw new EMFJSError("Invalid pixel format size");
                }

                // TODO: read pixel format blob
            }
        }
        if (hdrSize > 108) {
            // We have a EmfMetafileHeaderExtension2 record
            this.displayDevCxUm = reader.readUint32(); // in micrometers
            this.displayDevCyUm = reader.readUint32(); // in micrometers
            Helper.log(`[EMFHEADER] displayDevXyUM: ${this.displayDevCxUm/1000}displayDevCyUm: ${this.displayDevCyUm/1000}`)
        }
        
    }

    public toString(): string {
        return "{bounds: " + this.bounds.toString() + ", frame: " + this.frame.toString()
            + ", description: " + this.description + "}";
    }
}

export class EMFRecords {
    private _records: ((gdi: GDIContext) => void)[];
    public _header: EmfHeader;
    constructor(reader: Blob, first: number) {
        this._records = [];
        
        this._header = new EmfHeader(reader, first);
        let all = false;
        let curpos = first;
        main_loop: while (!all) {
            reader.seek(curpos);
            const type = reader.readUint32();
            const size = reader.readUint32();
            if (size < 8) {
                throw new EMFJSError("Invalid record size");
            }
            switch (type) {
                case Helper.GDI.RecordType.EMR_EOF:
                    all = true;
                    break main_loop;
                case Helper.GDI.RecordType.EMR_SETMAPMODE: {
                    const mapMode = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.setMapMode(mapMode);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETWINDOWORGEX: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.setWindowOrgEx(x, y);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETWINDOWEXTEX: {
                    const x = reader.readUint32();
                    const y = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setWindowExtEx(x, y);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETVIEWPORTORGEX: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.setViewportOrgEx(x, y);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETVIEWPORTEXTEX: {
                    const x = reader.readUint32();
                    const y = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setViewportExtEx(x, y);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SAVEDC: {
                    this._records.push((gdi) => {
                        gdi.saveDC();
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_RESTOREDC: {
                    const saved = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.restoreDC(saved);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETBKMODE: {
                    const bkMode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setBkMode(bkMode);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETBKCOLOR: {
                    const bkColor = new ColorRef(reader);
                    this._records.push((gdi) => {
                        gdi.setBkColor(bkColor);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_CREATEBRUSHINDIRECT: {
                    const index = reader.readUint32();
                    const brush = new Brush(reader);
                    this._records.push((gdi) => {
                        gdi.createBrush(index, brush);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_CREATEPEN: {
                    const index = reader.readUint32();
                    const pen = new Pen(reader, null);
                    if(pen.width === 0) pen.width = 1;
                    this._records.push((gdi) => {
                        gdi.createPen(index, pen);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_EXTCREATEPEN: {
                    const index = reader.readUint32();
                    const offBmi = reader.readUint32();
                    const cbBmi = reader.readUint32();
                    const offBits = reader.readUint32();
                    const cbBits = reader.readUint32();
                    const pen = new Pen(reader, {
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
                case Helper.GDI.RecordType.EMR_SELECTOBJECT: {
                    const idx = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.selectObject(idx, null);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_DELETEOBJECT: {
                    const idx = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.deleteObject(idx);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_RECTANGLE: {
                    const rect = new RectL(reader);
                    this._records.push((gdi) => {
                        gdi.rectangle(rect, 0, 0);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_ROUNDRECT: {
                    const rect = new RectL(reader);
                    const corner = new SizeL(reader);
                    this._records.push((gdi) => {
                        gdi.roundRect(rect, corner.cx, corner.cy);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_LINETO: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.lineTo(x, y);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_MOVETOEX: {
                    const x = reader.readInt32();
                    const y = reader.readInt32();
                    this._records.push((gdi) => {
                        gdi.moveToEx(x, y);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_POLYGON:
                case Helper.GDI.RecordType.EMR_POLYGON16: {
                    const isSmall = (type === Helper.GDI.RecordType.EMR_POLYGON16);
                    const bounds = new RectL(reader);
                    let cnt = reader.readUint32();
                    const points: PointS[] | PointL[] = [];
                    while (cnt > 0) {
                        points.push(isSmall ? new PointS(reader) : new PointL(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polygon(points, bounds, true);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_POLYPOLYGON:
                case Helper.GDI.RecordType.EMR_POLYPOLYGON16: {
                    const isSmall = (type === Helper.GDI.RecordType.EMR_POLYPOLYGON16);
                    const bounds = new RectL(reader);
                    const polyCnt = reader.readUint32();
                    reader.skip(4); // count
                    const polygonsPtCnts = [];
                    for (let i = 0; i < polyCnt; i++) {
                        polygonsPtCnts.push(reader.readUint32());
                    }

                    const polygons: PointS[][] | PointL[][] = [];
                    for (let i = 0; i < polyCnt; i++) {
                        const ptCnt = polygonsPtCnts[i];

                        const p = [];
                        for (let ip = 0; ip < ptCnt; ip++) {
                            p.push(isSmall ? new PointS(reader) : new PointL(reader));
                        }
                        polygons.push(p);
                    }
                    this._records.push((gdi) => {
                        gdi.polyPolygon(polygons, bounds);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETPOLYFILLMODE: {
                    const polyfillmode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setPolyFillMode(polyfillmode);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_POLYLINE16:
                case Helper.GDI.RecordType.EMR_POLYLINETO16: {
                    const isLineTo = (type === Helper.GDI.RecordType.EMR_POLYLINETO16);
                    const bounds = new RectL(reader);
                    let cnt = reader.readUint32();
                    const points: PointS[] = [];
                    while (cnt > 0) {
                        points.push(new PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polyline(isLineTo, points, bounds);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_POLYBEZIER:
                case Helper.GDI.RecordType.EMR_POLYBEZIERTO: {
                    const isPolyBezierTo = (type === Helper.GDI.RecordType.EMR_POLYBEZIERTO);
                    const bounds = new RectL(reader);
                    let cnt = reader.readUint32();
                    const points: PointL[] = [];
                    while (cnt > 0) {
                        points.push(new PointL(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polybezier(isPolyBezierTo, points, bounds);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_POLYBEZIER16: {
                    const bounds = new RectL(reader);
                    const start = new PointL(reader);
                    let cnt = reader.readUint32();
                    const points = [start];
                    while (cnt > 0) {
                        points.push(new PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polybezier(false, points, bounds);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_POLYBEZIERTO16: {
                    const bounds = new RectL(reader);
                    let cnt = reader.readUint32();
                    const points: PointS[] = [];
                    while (cnt > 0) {
                        points.push(new PointS(reader));
                        cnt--;
                    }
                    this._records.push((gdi) => {
                        gdi.polybezier(true, points, bounds);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETTEXTALIGN: {
                    const textAlign = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setTextAlign(textAlign);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETSTRETCHBLTMODE: {
                    const stretchMode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setStretchBltMode(stretchMode);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETBRUSHORGEX: {
                    const origin = new PointL(reader);
                    this._records.push((gdi) => {
                        gdi.setBrushOrgEx(origin);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_BEGINPATH: {
                    this._records.push((gdi) => {
                        gdi.beginPath();
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_ENDPATH: {
                    this._records.push((gdi) => {
                        gdi.endPath();
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_ABORTPATH: {
                    this._records.push((gdi) => {
                        gdi.abortPath();
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_CLOSEFIGURE: {
                    this._records.push((gdi) => {
                        gdi.closeFigure();
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_FILLPATH: {
                    const bounds = new RectL(reader);
                    this._records.push((gdi) => {
                        gdi.fillPath(bounds);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_STROKEPATH: {
                    const bounds = new RectL(reader);
                    this._records.push((gdi) => {
                        gdi.strokePath(bounds);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SELECTCLIPPATH: {
                    const rgnMode = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.selectClipPath(rgnMode);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_EXTSELECTCLIPRGN: {
                    reader.skip(4);
                    const rgnMode = reader.readUint32();
                    const region = rgnMode !== Helper.GDI.RegionMode.RGN_COPY ? new Region(reader) : null;
                    this._records.push((gdi) => {
                        if(region)  gdi.selectClipRgn(rgnMode, region);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_OFFSETCLIPRGN: {
                    const offset = new PointL(reader);
                    this._records.push((gdi) => {
                        gdi.offsetClipRgn(offset);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_SETMITERLIMIT: {
                    const miterLimit = reader.readUint32();
                    this._records.push((gdi) => {
                        gdi.setMiterLimit(miterLimit);
                    });
                    break;
                }
                case Helper.GDI.RecordType.EMR_POLYLINE:
                    Helper.log("[EMFRecords] EMR_POLYLINE")
                    break;
                case Helper.GDI.RecordType.EMR_POLYLINETO:
                    Helper.log("[EMFRecords] EMR_POLYLINETO")
                    break;
                case Helper.GDI.RecordType.EMR_POLYPOLYLINE:
                    Helper.log("[EMFRecords] EMR_POLYPOLYLINE")
                    break;
                case Helper.GDI.RecordType.EMR_SETPIXELV:
                    Helper.log("[EMFRecords] EMR_SETPIXELV")
                    break;
                case Helper.GDI.RecordType.EMR_SETMAPPERFLAGS:
                    Helper.log("[EMFRecords] EMR_SETMAPPERFLAGS")
                    break;
                case Helper.GDI.RecordType.EMR_SETROP2:
                    Helper.log("[EMFRecords] EMR_SETROP2")
                    break;
                case Helper.GDI.RecordType.EMR_SETCOLORADJUSTMENT:
                    Helper.log("[EMFRecords] EMR_SETCOLORADJUSTMENT")
                    break;
                case Helper.GDI.RecordType.EMR_SETTEXTCOLOR:
                    Helper.log("[EMFRecords] EMR_SETTEXTCOLOR")
                    break;
                case Helper.GDI.RecordType.EMR_SETMETARGN:
                    Helper.log("[EMFRecords] EMR_SETMEARGH")
                    break;
                case Helper.GDI.RecordType.EMR_EXCLUDECLIPRECT:
                    Helper.log("[EMFRecords] EMR_SETECLUDECLIPRECT")
                    break;
                case Helper.GDI.RecordType.EMR_INTERSECTCLIPRECT:
                    Helper.log("[EMFRecords] EMR_SETINTERSECTCLIPRECT")
                    break;
                case Helper.GDI.RecordType.EMR_SCALEVIEWPORTEXTEX:
                    Helper.log("[EMFRecords] EMR_SETSCALEVIEWPORTEXTEX")
                    break;
                case Helper.GDI.RecordType.EMR_SCALEWINDOWEXTEX:
                    Helper.log("[EMFRecords] EMR_SCALEWINDOWEXTEX")
                    break;
                case Helper.GDI.RecordType.EMR_SETWORLDTRANSFORM:
                    Helper.log("[EMFRecords] EMR_SETWORLDTRANSFORM")
                    break;
                case Helper.GDI.RecordType.EMR_MODIFYWORLDTRANSFORM:
                    Helper.log("[EMFRecords] EMR_MODIFYWORLDTRANSFORM")
                    break;
                case Helper.GDI.RecordType.EMR_ANGLEARC:
                    Helper.log("[EMFRecords] EMR_ANGLEARC")
                    break;
                case Helper.GDI.RecordType.EMR_ELLIPSE:
                    Helper.log("[EMFRecords] EMR_ELLIPSE")
                    break;
                case Helper.GDI.RecordType.EMR_ARC:
                    Helper.log("[EMFRecords] EMR_ARC")
                    break;
                case Helper.GDI.RecordType.EMR_CHORD:
                    Helper.log("[EMFRecords] EMR_CHORD")
                    break;
                case Helper.GDI.RecordType.EMR_PIE:
                    Helper.log("[EMFRecords] EMR_SETPIE")
                    break;
                case Helper.GDI.RecordType.EMR_SELECTPALETTE:
                    Helper.log("[EMFRecords] EMR_SELECTPLATTE")
                    break;
                case Helper.GDI.RecordType.EMR_CREATEPALETTE:
                    Helper.log("[EMFRecords] EMR_CREATEPALETTE")
                    break;
                case Helper.GDI.RecordType.EMR_SETPALETTEENTRIES:
                    Helper.log("[EMFRecords] EMR_SETPALETTEENTRIES")
                    break;
                case Helper.GDI.RecordType.EMR_RESIZEPALETTE:
                    Helper.log("[EMFRecords] EMR_RESIZEPALETTE")
                    break;
                case Helper.GDI.RecordType.EMR_REALIZEPALETTE:
                    Helper.log("[EMFRecords] EMR_REALIZEPALETTE")
                    break;
                case Helper.GDI.RecordType.EMR_EXTFLOODFILL:
                    Helper.log("[EMFRecords] EMR_EXTFLOODFILL")
                    break;
                case Helper.GDI.RecordType.EMR_ARCTO:
                    Helper.log("[EMFRecords] EMR_ARCTO")
                    break;
                case Helper.GDI.RecordType.EMR_POLYDRAW:
                    Helper.log("[EMFRecords] EMR_POLYDRAW")
                    break;
                case Helper.GDI.RecordType.EMR_SETARCDIRECTION:
                    Helper.log("[EMFRecords] EMR_SETARCDIRECTION")
                    break;
                case Helper.GDI.RecordType.EMR_STROKEANDFILLPATH:
                    Helper.log("[EMFRecords] EMR_STROKEANDFILLPATH")
                    break;
                case Helper.GDI.RecordType.EMR_FLATTENPATH:
                    Helper.log("[EMFRecords] EMR_FLATTENPATH")
                    break;
                case Helper.GDI.RecordType.EMR_WIDENPATH:
                    Helper.log("[EMFRecords] EMR_WIDENPATH")
                    break;
                case Helper.GDI.RecordType.EMR_COMMENT:
                    Helper.log("[EMFRecords] EMR_COMMENT")
                    break;
                case Helper.GDI.RecordType.EMR_FILLRGN:
                    Helper.log("[EMFRecords] EMR_SETFILLRGN")
                    break;
                case Helper.GDI.RecordType.EMR_FRAMERGN:
                    Helper.log("[EMFRecords] EMR_FRAMERGN")
                    break;
                case Helper.GDI.RecordType.EMR_INVERTRGN:
                    Helper.log("[EMFRecords] EMR_INVERTRGN")
                    break;
                case Helper.GDI.RecordType.EMR_PAINTRGN:
                    Helper.log("[EMFRecords] EMR_PAINTRGN")
                    break;
                case Helper.GDI.RecordType.EMR_BITBLT:
                    Helper.log("[EMFRecords] EMR_BITBLT")
                    break;
                case Helper.GDI.RecordType.EMR_STRETCHBLT:
                    Helper.log("[EMFRecords] EMR_SCRETCHBLT")
                    break;
                case Helper.GDI.RecordType.EMR_MASKBLT:
                    Helper.log("[EMFRecords] EMR_MASKBLT")
                    break;
                case Helper.GDI.RecordType.EMR_PLGBLT:
                    Helper.log("[EMFRecords] EMR_PLBLT")
                    break;
                case Helper.GDI.RecordType.EMR_SETDIBITSTODEVICE:
                    Helper.log("[EMFRecords] EMR_SETDIBITSTODEVICE")
                    break;
                case Helper.GDI.RecordType.EMR_STRETCHDIBITS:
                    Helper.log("[EMFRecords] EMR_STRETCHDIBITS")
                    break;
                case Helper.GDI.RecordType.EMR_EXTCREATEFONTINDIRECTW:
                    Helper.log("[EMFRecords] EMR_EXTCREATEFONTINIRECTW")
                    break;
                case Helper.GDI.RecordType.EMR_EXTTEXTOUTA:
                    Helper.log("[EMFRecords] EMR_EXTTEXTOUtA")
                    break;
                case Helper.GDI.RecordType.EMR_EXTTEXTOUTW:
                    Helper.log("[EMFRecords] EMR_EXTTEXTOUTw")
                    break;
                case Helper.GDI.RecordType.EMR_POLYPOLYLINE16:
                    Helper.log("[EMFRecords] EMR_POLYPOLYLINE16")
                    break;
                case Helper.GDI.RecordType.EMR_POLYDRAW16:
                    Helper.log("[EMFRecords] EMR_POLYDRAW16")
                    break;
                case Helper.GDI.RecordType.EMR_CREATEMONOBRUSH:
                    Helper.log("[EMFRecords] EMR_CREATEMONOBRUSH")
                    break;
                case Helper.GDI.RecordType.EMR_CREATEDIBPATTERNBRUSHPT:
                    Helper.log("[EMFRecords] EMR_CREATEDIBPATTERNBRUSHPT")
                    break;
                case Helper.GDI.RecordType.EMR_POLYTEXTOUTA:
                    Helper.log("[EMFRecords] EMR_POLYTEXTOUTA")
                    break;
                case Helper.GDI.RecordType.EMR_POLYTEXTOUTW:
                    Helper.log("[EMFRecords] EMR_POLYTEXTOUTW")
                    break;
                case Helper.GDI.RecordType.EMR_SETICMMODE:
                    Helper.log("[EMFRecords] EMR_SETICMMODE")
                    break;
                case Helper.GDI.RecordType.EMR_CREATECOLORSPACE:
                    Helper.log("[EMFRecords] EMR_CREATECOLORSPACE")
                    break;
                case Helper.GDI.RecordType.EMR_SETCOLORSPACE:
                    Helper.log("[EMFRecords] EMR_SETCOLORSPACE")
                    break;
                case Helper.GDI.RecordType.EMR_DELETECOLORSPACE:
                    Helper.log("[EMFRecords] EMR_DELETECOLORSPACE")
                    break;
                case Helper.GDI.RecordType.EMR_GLSRECORD:
                    Helper.log("[EMFRecords] EMR_GLSRECORD")
                    break;
                case Helper.GDI.RecordType.EMR_GLSBOUNDEDRECORD:
                    Helper.log("[EMFRecords] EMR_GLSBOUNDEDRECORD")
                    break;
                case Helper.GDI.RecordType.EMR_PIXELFORMAT:
                    Helper.log("[EMFRecords] EMR_SETPIXELFORMAT")
                    break;
                case Helper.GDI.RecordType.EMR_DRAWESCAPE:
                    Helper.log("[EMFRecords] EMR_DRAWESCAPE")
                    break;
                case Helper.GDI.RecordType.EMR_EXTESCAPE:
                    Helper.log("[EMFRecords] EMR_EXTESCAPE")
                    break;
                case Helper.GDI.RecordType.EMR_SMALLTEXTOUT:
                    Helper.log("[EMFRecords] EMR_SMALLTEXTOUT")
                    break;
                case Helper.GDI.RecordType.EMR_FORCEUFIMAPPING:
                    Helper.log("[EMFRecords] EMR_FORCEUFIMAPPING")
                    break;
                case Helper.GDI.RecordType.EMR_NAMEDESCAPE:
                    Helper.log("[EMFRecords] EMR_NAMEDESCAPE")
                    break;
                case Helper.GDI.RecordType.EMR_COLORCORRECTPALETTE:
                    Helper.log("[EMFRecords] EMR_COLORCORRECTPALETTE")
                    break;
                case Helper.GDI.RecordType.EMR_SETICMPROFILEA:
                    Helper.log("[EMFRecords] EMR_SETPICMPROFILEA")
                    break;
                case Helper.GDI.RecordType.EMR_SETICMPROFILEW:
                    Helper.log("[EMFRecords] EMR_SETICMPROFILEW")
                    break;
                case Helper.GDI.RecordType.EMR_ALPHABLEND:
                    Helper.log("[EMFRecords] EMR_SETALPHABLEND")
                    break;
                case Helper.GDI.RecordType.EMR_SETLAYOUT:
                    Helper.log("[EMFRecords] EMR_SETLAYOUT")
                    break;
                case Helper.GDI.RecordType.EMR_TRANSPARENTBLT:
                    Helper.log("[EMFRecords] EMR_SETPIXELV")
                    break;
                case Helper.GDI.RecordType.EMR_GRADIENTFILL:
                    Helper.log("[EMFRecords] EMR_GRADIENTFILL")
                    break;
                case Helper.GDI.RecordType.EMR_SETLINKEDUFIS:
                    Helper.log("[EMFRecords] EMR_SETLINKEDUFIS")
                    break;
                case Helper.GDI.RecordType.EMR_SETTEXTJUSTIFICATION:
                    Helper.log("[EMFRecords] EMR_SETTEXTJUSTIFICATION")
                    break;
                case Helper.GDI.RecordType.EMR_COLORMATCHTOTARGETW:
                    Helper.log("[EMFRecords] EMR_COLORMATCHTOTARGETW")
                    break;
                case Helper.GDI.RecordType.EMR_CREATECOLORSPACEW:
                default: {
                    let recordName = "UNKNOWN";
                    for (const name in Helper.GDI.RecordType) {
                        const recordTypes: any = Helper.GDI.RecordType;
                        if (recordTypes[name] === type) {
                            recordName = name;
                            break;
                        }
                    }
                    Helper.log("[EMFRecords] " + recordName + " record (0x" + type.toString(16) + ") at offset 0x"
                        + curpos.toString(16) + " with " + size + " bytes");
                    break;
                }
            }

            curpos += size;
        }

        if (!all) {
            throw new EMFJSError("Could not read all records");
        }
    }

    public play(gdi: GDIContext): void {
        const len = this._records.length;
        for (let i = 0; i < len; i++) {
            this._records[i](gdi);
        }
    }
}
