import { Blob } from "./Blob";
import { Obj, RectL } from "./Primitives";
export declare class Region extends Obj {
    bounds: RectL | null;
    scans: Scan[] | null;
    complexity: number;
    constructor(reader: Blob | null, copy?: Region | null);
    clone(): Region;
    toString(): string;
    _updateComplexity(): void;
    subtract(rect: RectL): void;
    intersect(rect: RectL): void;
    offset(offX: number, offY: number): void;
}
export declare function CreateSimpleRegion(left: number, top: number, right: number, bottom: number): Region;
export declare class Scan {
    top: number;
    bottom: number;
    scanlines: {
        left: number;
        right: number;
    }[];
    constructor(r: RectL | null, copy?: Scan);
    clone(): Scan;
    append(r: RectL): void;
    subtract(left: number, right: number): boolean;
    intersect(left: number, right: number): boolean;
}
