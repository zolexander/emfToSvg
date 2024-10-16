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
import { EMFJSError, Helper } from "./Helper";
import { Obj, RectL } from "./Primitives";

export class Region extends Obj {
    public bounds: RectL|null;
    public scans: Scan[]|null;
    public complexity: number;
    constructor(reader: Blob |null, copy?: Region|null) {
        super("region");
        if (reader != null) {
            const hdrSize = reader.readUint32();
            if (hdrSize !== 32) {
                throw new EMFJSError("Invalid region header");
            }
            reader.skip(4);
            const rectCnt = reader.readUint32();
            const rgnSize = reader.readUint32();
            if (rectCnt * 16 !== rgnSize) {
                throw new EMFJSError("Invalid region data");
            }

            this.bounds = new RectL(reader);
            this.scans = [];
            let scanLine: any;
            for (let i = 0; i < rectCnt; i++) {
                const r = new RectL(reader);
                if(scanLine) {
                    if (!!scanLine || scanLine.top !== r.top || scanLine.bottom !== r.bottom) {
                        scanLine = new Scan(r);
                        this.scans.push(scanLine);
                    } else {
                        scanLine.append(r);
                    }
            }
            }
            this._updateComplexity();
        } else if (copy != null) {
            this.bounds = copy.bounds != null ? copy.bounds.clone() : null;
            if (copy.scans != null) {
                this.scans = [];
                for (let i = 0; i < copy.scans.length; i++) {
                    this.scans.push(copy.scans[i].clone());
                }
            } else {
                this.scans = null;
            }
            this.complexity = copy.complexity;
        } else {
            this.bounds = null;
            this.scans = null;
            this.complexity = 0;
        }
    }

    public clone(): Region {
        return new Region(null, this);
    }

    public toString(): string {
        const _complexity = ["null", "simple", "complex"];
        return "{complexity: " + _complexity[this.complexity]
            + " bounds: " + (this.bounds != null ? this.bounds.toString() : "[none]")
            + " #scans: " + (this.scans != null ? this.scans.length : "[none]") + "}";
    }

    public _updateComplexity(): void {
        if (this.bounds == null) {
            this.complexity = 0;
            this.scans = null;
        } else if (this.bounds.empty()) {
            this.complexity = 0;
            this.scans = null;
            this.bounds = null;
        } else if (this.scans == null) {
            this.complexity = 1;
        } else {
            this.complexity = 2;
            if (this.scans.length === 1) {
                const scan = this.scans[0];
                if (scan.top === this.bounds.top && scan.bottom === this.bounds.bottom && scan.scanlines.length === 1) {
                    const scanline = scan.scanlines[0];
                    if (scanline.left === this.bounds.left && scanline.right === this.bounds.right) {
                        this.scans = null;
                        this.complexity = 1;
                    }
                }
            }
        }
    }

    public subtract(rect: RectL): void {
        Helper.log("[emf] Region " + this.toString() + " subtract " + rect.toString());

        if (this.bounds != null) {
            const isect = this.bounds.intersect(rect);
            if (isect != null) { // Only need to do anything if there is any chance of an overlap
                if (this.scans == null) {
                    // We currently have a simple region and there is some kind of an overlap.
                    // We need to create scanlines now.  Simplest method is to fake one scan line
                    // that equals the simple region and re-use the same logic as for complex regions
                    this.scans = [];
                    this.scans.push(new Scan(new RectL(null, this.bounds.left, this.bounds.top,
                        this.bounds.right, this.bounds.bottom)));
                    this.complexity = 2;
                }

                // We (now) have a complex region.  First we skip any scans that are entirely above rect.top
                // The first scan that falls partially below rect.top needs to be split into two scans.
                let si = 0;
                while (si < this.scans.length) {
                    const scan = this.scans[si];
                    if (scan.bottom >= rect.top) {
                        // We need to clone this scan into two so that we can subtract from the second one
                        const cloned = scan.clone();
                        scan.bottom = rect.top - 1;
                        cloned.top = rect.top;
                        if (scan.top >= scan.bottom) {
                            this.scans[si] = cloned;
                        } else {
                            Helper.log("[emf] Region split top scan " + si + " for substraction");
                            this.scans.splice(++si, 0, cloned);
                        }
                        break;
                    }
                    si++;
                }

                // Now find the first one that falls at least partially below rect.bottom, which needs to be
                // split if it is only partially below rect.bottom
                const first = si;
                while (si < this.scans.length) {
                    const scan = this.scans[si];
                    if (scan.top > rect.bottom) {
                        break;
                    }
                    if (scan.bottom > rect.bottom) {
                        // We need to clone this scan into two so that we can subtract from the first one
                        const cloned = scan.clone();
                        scan.bottom = rect.bottom;
                        cloned.top = rect.bottom + 1;
                        if (scan.top >= scan.bottom) {
                            this.scans[si] = cloned;
                        } else {
                            Helper.log("[emf] Region split bottom scan " + si + " for substraction");
                            this.scans.splice(++si, 0, cloned);
                        }
                        break;
                    }
                    si++;
                }

                // Now perform a subtraction on each scan in between rect.top and rect.bottom.  Because we
                // cloned scans that partially overlapped rect.top and rect.bottom, we don't have to
                // account for this anymore.
                if (first < this.scans.length) {
                    let last = si;
                    si = first;
                    while (si < last) {
                        const scan = this.scans[si];
                        if (!scan.subtract(rect.left, rect.right)) {
                            Helper.log("[emf] Region remove now empty scan " + si + " due to subtraction");
                            this.scans.splice(si, 1);
                            last--;
                            continue;
                        }

                        si++;
                    }
                }

                // Update bounds
                if (this.scans != null) {
                    let left;
                    let top;
                    let right;
                    let bottom;
                    const len = this.scans.length;
                    for (let i = 0; i < len; i++) {
                        const scan = this.scans[i];
                        if (i === 0) {
                            top = scan.top;
                        }
                        if (i === len - 1) {
                            bottom = scan.bottom;
                        }

                        const slen = scan.scanlines.length;
                        if (slen > 0) {
                            let scanline = scan.scanlines[0];
                            if (left == null || scanline.left < left) {
                                left = scanline.left;
                            }
                            scanline = scan.scanlines[slen - 1];
                            if (right == null || scanline.right > right) {
                                right = scanline.right;
                            }
                        }
                    }

                    if (left != null && top != null && right != null && bottom != null) {
                        this.bounds = new RectL(null, left, top, right, bottom);
                        this._updateComplexity();
                    } else {
                        // This has to be a null region now
                        this.bounds = null;
                        this.scans = null;
                        this.complexity = 0;
                    }
                } else {
                    this._updateComplexity();
                }
            }
        }

        Helper.log("[emf] Region subtraction -> " + this.toString());
    }

    public intersect(rect: RectL): void {
        Helper.log("[emf] Region " + this.toString() + " intersect with " + rect.toString());
        if (this.bounds != null) {
            this.bounds = this.bounds.intersect(rect);
            if (this.bounds != null) {
                if (this.scans != null) {
                    let si = 0;
                    // Remove any scans that are entirely above the new bounds.top
                    while (si < this.scans.length) {
                        const scan = this.scans[si];
                        if (scan.bottom < this.bounds.top) {
                            si++;
                        } else {
                            break;
                        }
                    }
                    if (si > 0) {
                        Helper.log("[emf] Region remove " + si + " scans from top");
                        this.scans.splice(0, si);

                        // Adjust the first scan's top to match the new bounds.top
                        if (this.scans.length > 0) {
                            this.scans[0].top = this.bounds.top;
                        }
                    }

                    // Get rid of anything that falls outside the new bounds.left/bounds.right
                    si = 0;
                    while (si < this.scans.length) {
                        const scan = this.scans[si];
                        if (scan.top > this.bounds.bottom) {
                            // Remove this and all remaining scans that fall entirely below the new bounds.bottom
                            Helper.log("[emf] Region remove " + (this.scans.length - si) + " scans from bottom");
                            this.scans.splice(si, this.scans.length - si);
                            break;
                        }
                        if (!scan.intersect(this.bounds.left, this.bounds.right)) {
                            // Remove now empty scan
                            Helper.log("[emf] Region remove now empty scan " + si + " due to intersection");
                            this.scans.splice(si, 1);
                            continue;
                        }
                        si++;
                    }

                    // If there are any scans left, adjust the last one's bottom to the new bounds.bottom
                    if (this.scans.length > 0) {
                        this.scans[this.scans.length - 1].bottom = this.bounds.bottom;
                    }

                    this._updateComplexity();
                }
            } else {
                this.scans = null;
                this.complexity = 0;
            }
        }
        Helper.log("[emf] Region intersection -> " + this.toString());
    }

    public offset(offX: number, offY: number): void {
        if (this.bounds != null) {
            this.bounds.left += offX;
            this.bounds.top += offY;
            this.bounds.right += offX;
            this.bounds.bottom += offY;
        }

        if (this.scans != null) {
            const slen = this.scans.length;
            for (let si = 0; si < slen; si++) {
                const scan = this.scans[si];
                scan.top += offY;
                scan.bottom += offY;

                const len = scan.scanlines.length;
                for (let i = 0; i < len; i++) {
                    const scanline = scan.scanlines[i];
                    scanline.left += offX;
                    scanline.right += offX;
                }
            }
        }
    }
}

export function CreateSimpleRegion(left: number, top: number, right: number, bottom: number): Region {
    const rgn = new Region(null, null);
    rgn.bounds = new RectL(null, left, top, right, bottom);
    rgn._updateComplexity();
    return rgn;
}

export class Scan {
    public top: number;
    public bottom: number;
    public scanlines: { left: number, right: number }[];

    constructor(r: RectL|null, copy?: Scan) {
        if (r != null) {
            this.top = r.top;
            this.bottom = r.bottom;
            this.scanlines = [{left: r.left, right: r.right}];
        } else if (copy != null) {
            this.top = copy.top;
            this.bottom = copy.bottom;
            this.scanlines = [];
            for (let i = 0; i < copy.scanlines.length; i++) {
                const scanline = copy.scanlines[i];
                this.scanlines.push({left: scanline.left, right: scanline.right});
            }
        }
    }

    public clone(): Scan {
        return new Scan(null, this);
    }

    public append(r: RectL): void {
        this.scanlines.push({left: r.left, right: r.right});
    }

    public subtract(left: number, right: number): boolean {
        let i;

        // Keep everything on the left side
        i = 0;
        while (i < this.scanlines.length) {
            const scanline = this.scanlines[i];
            if (scanline.left <= left) {
                if (scanline.right >= left) {
                    scanline.right = left - 1;
                    if (scanline.left >= scanline.right) {
                        this.scanlines.splice(i, 1);
                        continue;
                    }
                }
                i++;
            } else {
                break;
            }
        }

        // Find the first one that may exceed to the right side
        const first = i;
        let cnt = 0;
        while (i < this.scanlines.length) {
            const scanline = this.scanlines[i];
            if (scanline.right > right) {
                scanline.left = right;
                cnt = i - first;
                if (scanline.left >= scanline.right) {
                    cnt++;
                }
                break;
            }
            i++;
        }

        // Delete everything we're subtracting
        if (cnt > 0 && first < this.scanlines.length) {
            this.scanlines.splice(first, cnt);
        }

        return this.scanlines.length > 0;
    }

    public intersect(left: number, right: number): boolean {
        // Get rid of anything that falls entirely outside to the left
        for (let i = 0; i < this.scanlines.length; i++) {
            const scanline = this.scanlines[i];
            if (scanline.left >= left || scanline.right >= left) {
                if (i > 0) {
                    this.scanlines.splice(0, i);
                }
                break;
            }
        }

        if (this.scanlines.length > 0) {
            // Adjust the first to match the left, if needed
            let scanline = this.scanlines[0];
            if (scanline.left < left) {
                scanline.left = left;
            }

            // Get rid of anything that falls entirely outside to the right
            for (let i = 0; i < this.scanlines.length; i++) {
                scanline = this.scanlines[i];
                if (scanline.left > right) {
                    this.scanlines.splice(i, this.scanlines.length - i);
                    break;
                }
            }

            if (this.scanlines.length > 0) {
                // Adjust the last to match the right, if needed
                scanline = this.scanlines[this.scanlines.length - 1];
                if (scanline.right > right) {
                    scanline.right = right;
                }
            }
        }
        return this.scanlines.length > 0;
    }
}
