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
exports.PatternBitmap16 = exports.Bitmap16 = exports.DIBitmap = exports.BitmapInfo = void 0;
const Helper_1 = require("./Helper");
class BitmapCoreHeader {
    constructor(reader, skipsize) {
        if (skipsize) {
            reader.skip(4);
        }
        this.width = reader.readUint16();
        this.height = reader.readUint16();
        this.planes = reader.readUint16();
        this.bitcount = reader.readUint16();
    }
    colors() {
        return this.bitcount <= 8 ? 1 << this.bitcount : 0;
    }
}
class BitmapInfoHeader {
    constructor(reader, skipsize) {
        if (skipsize) {
            reader.skip(4);
        }
        this.width = reader.readInt32();
        this.height = reader.readInt32();
        this.planes = reader.readUint16();
        this.bitcount = reader.readUint16();
        this.compression = reader.readUint32();
        this.sizeimage = reader.readUint32();
        this.xpelspermeter = reader.readInt32();
        this.ypelspermeter = reader.readInt32();
        this.clrused = reader.readUint32();
        this.clrimportant = reader.readUint32();
    }
    colors() {
        if (this.clrused !== 0) {
            return this.clrused < 256 ? this.clrused : 256;
        }
        else {
            return this.bitcount > 8 ? 0 : 1 << this.bitcount;
        }
    }
}
class BitmapInfo {
    constructor(reader, usergb) {
        this._reader = reader;
        this._offset = reader.pos;
        this._usergb = usergb;
        const hdrsize = reader.readUint32();
        this._infosize = hdrsize;
        if (hdrsize === Helper_1.Helper.GDI.BITMAPCOREHEADER_SIZE) {
            this._header = new BitmapCoreHeader(reader, false);
            this._infosize += this._header.colors() * (usergb ? 3 : 2);
        }
        else {
            this._header = new BitmapInfoHeader(reader, false);
            const masks = this._header.compression === Helper_1.Helper.GDI.BitmapCompression.BI_BITFIELDS ? 3 : 0;
            if (hdrsize <= Helper_1.Helper.GDI.BITMAPINFOHEADER_SIZE + (masks * 4)) {
                this._infosize = Helper_1.Helper.GDI.BITMAPINFOHEADER_SIZE + (masks * 4);
            }
            this._infosize += this._header.colors() * (usergb ? 4 : 2);
        }
    }
    getWidth() {
        return this._header.width;
    }
    getHeight() {
        return Math.abs(this._header.height);
    }
    infosize() {
        return this._infosize;
    }
    header() {
        return this._header;
    }
}
exports.BitmapInfo = BitmapInfo;
class DIBitmap {
    constructor(reader, size) {
        this._reader = reader;
        this._offset = reader.pos;
        this._size = size;
        this._info = new BitmapInfo(reader, true);
    }
    getWidth() {
        return this._info.getWidth();
    }
    getHeight() {
        return this._info.getHeight();
    }
    base64ref() {
        const prevpos = this._reader.pos;
        this._reader.seek(this._offset);
        let mime = "image/bmp";
        const header = this._info.header();
        let data;
        if (header instanceof BitmapInfoHeader && header.compression != null) {
            switch (header.compression) {
                case Helper_1.Helper.GDI.BitmapCompression.BI_JPEG:
                    mime = "data:image/jpeg";
                    break;
                case Helper_1.Helper.GDI.BitmapCompression.BI_PNG:
                    mime = "data:image/png";
                    break;
                default:
                    data = this.makeBitmapFileHeader();
                    break;
            }
        }
        else {
            data = this.makeBitmapFileHeader();
        }
        if (data != null) {
            data += this._reader.readBinary(this._size);
        }
        else {
            data = this._reader.readBinary(this._size);
        }
        const ref = "data:" + mime + ";base64," + btoa(data);
        this._reader.seek(prevpos);
        return ref;
    }
    makeBitmapFileHeader() {
        const buf = new ArrayBuffer(14);
        const view = new Uint8Array(buf);
        view[0] = 0x42;
        view[1] = 0x4d;
        Helper_1.Helper._writeUint32Val(view, 2, this._size + 14);
        Helper_1.Helper._writeUint32Val(view, 10, this._info.infosize() + 14);
        return Helper_1.Helper._blobToBinary(view);
    }
}
exports.DIBitmap = DIBitmap;
class Bitmap16 {
    constructor(reader, size) {
        if (reader != null) {
            size = size;
            this._reader = reader;
            this._offset = reader.pos;
            this._size = size;
            this.type = reader.readInt16();
            this.width = reader.readInt16();
            this.height = reader.readInt16();
            this.widthBytes = reader.readInt16();
            this.planes = reader.readUint8();
            this.bitsPixel = reader.readUint8();
            this.bitsOffset = reader.pos;
            this.bitsSize = (((this.width * this.bitsPixel + 15) >> 4) << 1) * this.height;
            if (this.bitsSize > size - 10) {
                throw new Helper_1.WMFJSError("Bitmap should have " + this.bitsSize + " bytes, but has " + (size - 10));
            }
        }
        else {
            const copy = size;
            this._reader = copy._reader;
            this._offset = copy._offset;
            this._size = copy._size;
            this.type = copy.type;
            this.width = copy.width;
            this.height = copy.height;
            this.widthBytes = copy.widthBytes;
            this.planes = copy.planes;
            this.bitsPixel = copy.bitsPixel;
            this.bitsOffset = copy.bitsOffset;
            this.bitsSize = copy.bitsSize;
        }
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    clone() {
        return new Bitmap16(null, this);
    }
}
exports.Bitmap16 = Bitmap16;
class PatternBitmap16 extends Bitmap16 {
    constructor(reader, size) {
        super(reader, size);
        if (reader != null) {
            this.bitsOffset += 22; // skip bits (4 bytes) + reserved (18 bytes)
        }
    }
    clone() {
        return new PatternBitmap16(null, this);
    }
}
exports.PatternBitmap16 = PatternBitmap16;
