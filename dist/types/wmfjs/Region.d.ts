import { Blob } from "./Blob";
import { Obj, Rect } from "./Primitives";
export declare class Region extends Obj {
    bounds: Rect | null;
    scans: Scan[] | null;
    complexity: number;
    constructor(reader: Blob | null, copy?: Region | null);
    clone(): Region;
    toString(): string;
    _updateComplexity(): void;
    subtract(rect: Rect): void;
    intersect(rect: Rect): void;
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
    constructor(reader: Blob | null, copy?: Scan | null, top?: number, bottom?: number, scanlines?: {
        left: number;
        right: number;
    }[]);
    clone(): Scan;
    subtract(left: number, right: number): boolean;
    intersect(left: number, right: number): boolean;
    toString(): string;
}
