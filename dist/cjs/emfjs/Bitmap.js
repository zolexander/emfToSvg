"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
exports.DIBitmap = exports.BitmapInfo = void 0;
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
        this._usergb = usergb;
        const hdrsize = reader.readUint32();
        this._infosize = hdrsize;
        if (hdrsize === Helper_1.Helper.GDI.BITMAPCOREHEADER_SIZE) {
            this._header = new BitmapCoreHeader(reader, false);
            this._infosize += this._header.colors() * (usergb ? 3 : 2);
        }
        else {
            this._header = new BitmapInfoHeader(reader, false);
            const masks = this._header.compression
                === Helper_1.Helper.GDI.BitmapCompression.BI_BITFIELDS ? 3 : 0;
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
    constructor(reader, bitmapInfo) {
        this._reader = reader;
        this._offset = reader.pos;
        this._location = bitmapInfo;
        this._info = new BitmapInfo(reader, true);
    }
    getWidth() {
        return this._info.getWidth();
    }
    getHeight() {
        return this._info.getHeight();
    }
    totalSize() {
        return this._location.header.size + this._location.data.size;
    }
    makeBitmapFileHeader() {
        const buf = new ArrayBuffer(14);
        const view = new Uint8Array(buf);
        view[0] = 0x42;
        view[1] = 0x4d;
        Helper_1.Helper._writeUint32Val(view, 2, this.totalSize() + 14);
        Helper_1.Helper._writeUint32Val(view, 10, this._info.infosize() + 14);
        return Helper_1.Helper._blobToBinary(view);
    }
    base64ref() {
        const prevpos = this._reader.pos;
        this._reader.seek(this._offset);
        let mime = 'image/bmp';
        const header = this._info.header();
        let data;
        if (header instanceof BitmapInfoHeader && header.compression != null) {
            switch (header.compression) {
                case Helper_1.Helper.GDI.BitmapCompression.BI_JPEG:
                    mime = 'data:image/jpeg';
                    break;
                case Helper_1.Helper.GDI.BitmapCompression.BI_PNG:
                    mime = 'data:image/png';
                    break;
                default:
                    data = this.makeBitmapFileHeader();
                    break;
            }
        }
        else {
            data = this.makeBitmapFileHeader();
        }
        this._reader.seek(this._location.header.offset);
        if (data != null) {
            data += this._reader.readBinary(this._location.header.size);
        }
        else {
            data = this._reader.readBinary(this._location.header.size);
        }
        this._reader.seek(this._location.data.offset);
        data += this._reader.readBinary(this._location.data.size);
        const ref = 'data:' + mime + ';base64,' + btoa(data);
        this._reader.seek(prevpos);
        return ref;
    }
}
exports.DIBitmap = DIBitmap;
