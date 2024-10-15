"use strict";
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
exports.resizeViewBox = exports.resizePath = exports.Obj = exports.SizeL = exports.RectL = exports.PointL = exports.PointS = void 0;
const Helper_1 = require("./Helper");
class PointS {
    constructor(reader, x, y) {
        if (reader != null) {
            this.x = reader.readInt16();
            this.y = reader.readInt16();
        }
        else {
            if (x)
                this.x = x;
            if (y)
                this.y = y;
        }
    }
    clone() {
        return new PointS(null, this.x, this.y);
    }
    toString() {
        return `{'x':'${this.x}','y':'${this.y}'}`;
    }
}
exports.PointS = PointS;
class PointL {
    constructor(reader, x, y) {
        if (reader != null) {
            this.x = reader.readInt32();
            this.y = reader.readInt32();
        }
        else {
            if (x)
                this.x = x;
            if (y)
                this.y = y;
        }
    }
    clone() {
        return new PointL(null, this.x, this.y);
    }
    toString() {
        return `{'x': '${this.x}','y':'${this.y}'}`;
    }
}
exports.PointL = PointL;
class RectL {
    constructor(reader, left, top, right, bottom) {
        if (reader != null) {
            this.left = reader.readInt32();
            this.top = reader.readInt32();
            this.right = reader.readInt32();
            this.bottom = reader.readInt32();
        }
        else {
            if (bottom)
                this.bottom = bottom;
            if (right)
                this.right = right;
            if (top)
                this.top = top;
            if (left)
                this.left = left;
        }
    }
    clone() {
        return new RectL(null, this.left, this.top, this.right, this.bottom);
    }
    toString() {
        return '{left: ' + this.left + ', top: ' + this.top + ', right: ' + this.right
            + ', bottom: ' + this.bottom + ' }';
    }
    empty() {
        return this.left >= this.right || this.top >= this.bottom;
    }
    intersect(rectL) {
        if (this.empty() || rectL.empty()) {
            return null;
        }
        if (this.left >= rectL.right || this.top >= rectL.bottom ||
            this.right <= rectL.left || this.bottom <= rectL.top) {
            return null;
        }
        return new RectL(null, Math.max(this.left, rectL.left), Math.max(this.top, rectL.top), Math.min(this.right, rectL.right), Math.min(this.bottom, rectL.bottom));
    }
}
exports.RectL = RectL;
class SizeL {
    constructor(reader, cx, cy) {
        if (reader != null) {
            this.cx = reader.readUint32();
            this.cy = reader.readUint32();
        }
        else {
            if (cx)
                this.cx = cx;
            if (cy)
                this.cy = cy;
        }
    }
    clone() {
        return new SizeL(null, this.cx, this.cy);
    }
    toString() {
        return `{'cx':'${this.cx}','cy': '${this.cy}'}`;
    }
}
exports.SizeL = SizeL;
class Obj {
    constructor(type) {
        if (type)
            this.type = type;
    }
    clone() {
        throw new Helper_1.EMFJSError('clone not implemented');
    }
    toString() {
        throw new Helper_1.EMFJSError('toString not implemented');
    }
}
exports.Obj = Obj;
function resizePath(d, scale) {
    const resdArray = [];
    const pathArray = d.split(' ');
    const regex = /^[a-zA-Z]+$/;
    pathArray.forEach((element) => {
        if (!regex.test(element)) {
            resdArray.push((parseFloat(element) * scale).toFixed(2));
        }
        else {
            resdArray.push(element);
        }
    });
    return resdArray.join(' ');
}
exports.resizePath = resizePath;
function resizeViewBox(str, scale) {
    const viewBoxArr = str.split(' ');
    const resultArr = [];
    viewBoxArr.forEach((el) => {
        resultArr.push((el * scale).toString());
    });
    return resultArr.join(' ');
}
exports.resizeViewBox = resizeViewBox;
