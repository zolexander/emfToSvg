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
exports.Obj = exports.Rect = exports.PointS = void 0;
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
        return "{x: " + this.x + ", y: " + this.y + "}";
    }
}
exports.PointS = PointS;
class Rect {
    constructor(reader, left, top, right, bottom) {
        if (reader != null) {
            this.bottom = reader.readInt16();
            this.right = reader.readInt16();
            this.top = reader.readInt16();
            this.left = reader.readInt16();
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
        return new Rect(null, this.left, this.top, this.right, this.bottom);
    }
    toString() {
        return "{left: " + this.left + ", top: " + this.top + ", right: " + this.right
            + ", bottom: " + this.bottom + "}";
    }
    empty() {
        return this.left >= this.right || this.top >= this.bottom;
    }
    intersect(rect) {
        if (this.empty() || rect.empty()) {
            return null;
        }
        if (this.left >= rect.right || this.top >= rect.bottom ||
            this.right <= rect.left || this.bottom <= rect.top) {
            return null;
        }
        return new Rect(null, Math.max(this.left, rect.left), Math.max(this.top, rect.top), Math.min(this.right, rect.right), Math.min(this.bottom, rect.bottom));
    }
}
exports.Rect = Rect;
class Obj {
    constructor(type) {
        this.type = type;
    }
    clone() {
        throw new Helper_1.WMFJSError("clone not implemented");
    }
    toString() {
        throw new Helper_1.WMFJSError("toString not implemented");
    }
}
exports.Obj = Obj;
