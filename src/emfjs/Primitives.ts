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
import { EMFJSError } from "./Helper";

export class PointS {
    public x: number;
    public y: number;
    constructor(reader: Blob|null, x?: number, y?: number) {
        if (reader != null) {
            this.x = reader.readInt16();
            this.y = reader.readInt16();
        } else {
            if(x) this.x = x;
            if(y) this.y = y;

        }
    }

    public clone(): PointS {
        return new PointS(null, this.x, this.y);
    }

    public toString(): string {
        return `{"x":"${this.x}","y":"${this.y}"}`;
    }
}

export class PointL {
    public x: number;
    public y: number;
    constructor(reader: Blob|null, x?: number, y?: number) {
        if (reader != null) {
            this.x = reader.readInt32();
            this.y = reader.readInt32();
        } else {
            if(x) this.x = x;
            if(y) this.y = y;

        }
    }

    public clone(): PointL {
        return new PointL(null, this.x, this.y);
    }

    public toString(): string {
        return `{"x": "${this.x}","y":"${this.y}"}`;
    }
}

export class RectL {
    public left: number;
    public top: number;
    public right: number;
    public bottom: number;
    constructor(reader: Blob|null, left?: number, top?: number, right?: number, bottom?: number) {
        if (reader != null) {
            this.left = reader.readInt32();
            this.top = reader.readInt32();
            this.right = reader.readInt32();
            this.bottom = reader.readInt32();
        } else {
            if(bottom) this.bottom = bottom;
            if(right) this.right = right;
            if(top) this.top = top;
            if(left) this.left = left;
        }
    }

    public clone(): RectL {
        return new RectL(null, this.left, this.top, this.right, this.bottom);
    }

    public toString(): string {
        return "{left: " + this.left + ", top: " + this.top + ", right: " + this.right
            + ", bottom: " + this.bottom + " }";
    }

    public empty(): boolean {
        return this.left >= this.right || this.top >= this.bottom;
    }

    public intersect(rectL: RectL): null | RectL {
        if (this.empty() || rectL.empty()) {
            return null;
        }
        if (this.left >= rectL.right || this.top >= rectL.bottom ||
            this.right <= rectL.left || this.bottom <= rectL.top) {
            return null;
        }
        return new RectL(null, Math.max(this.left, rectL.left), Math.max(this.top, rectL.top),
            Math.min(this.right, rectL.right), Math.min(this.bottom, rectL.bottom));
    }
}

export class SizeL {
    public cx: number;
    public cy: number;
    constructor(reader: Blob|null, cx?: number, cy?: number) {
        if (reader != null) {
            this.cx = reader.readUint32();
            this.cy = reader.readUint32();
        } else {
            if(cx) this.cx = cx;
            if(cy) this.cy = cy;
        }
    }

    public clone(): SizeL {
        return new SizeL(null, this.cx, this.cy);
    }

    public toString(): string {
        return `{"cx":"${this.cx}","cy": "${this.cy}"}`;
    }
}

export class Obj {
    public type: string;

    constructor(type: string) {
        if(type) this.type = type;
    }

    public clone(): Obj {
        throw new EMFJSError("clone not implemented");
    }

    public toString(): string {
        throw new EMFJSError("toString not implemented");
    }
}
export function resizePath(d:string,scale:number) {
    let resdArray: Array<string> = [];
    let pathArray = d.split(' ');
    const regex = /^[a-zA-Z]+$/;
    pathArray.forEach((element:string) =>{
        if(!regex.test(element)){
            resdArray.push((parseFloat(element)*scale).toFixed(2));
        } else {
            resdArray.push(element)
        }
    });
    return resdArray.join(' ');
}

export function resizeViewBox(str:string,scale:number) {
    let viewBoxArr = str.split(' ');
    let resultArr: Array<string> = [];
    viewBoxArr.forEach((el:any) => {
         resultArr.push((el*scale).toString())
    });
    return resultArr.join(" ");
}
