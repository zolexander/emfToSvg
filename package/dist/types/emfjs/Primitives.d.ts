import { Blob } from './Blob';
export declare class PointS {
    x: number;
    y: number;
    constructor(reader: Blob | null, x?: number, y?: number);
    clone(): PointS;
    toString(): string;
}
export declare class PointL {
    x: number;
    y: number;
    constructor(reader: Blob | null, x?: number, y?: number);
    clone(): PointL;
    toString(): string;
}
export declare class RectL {
    left: number;
    top: number;
    right: number;
    bottom: number;
    constructor(reader: Blob | null, left?: number, top?: number, right?: number, bottom?: number);
    clone(): RectL;
    toString(): string;
    empty(): boolean;
    intersect(rectL: RectL): null | RectL;
}
export declare class SizeL {
    cx: number;
    cy: number;
    constructor(reader: Blob | null, cx?: number, cy?: number);
    clone(): SizeL;
    toString(): string;
}
export declare class Obj {
    type: string;
    constructor(type: string);
    clone(): Obj;
    toString(): string;
}
export declare function resizePath(d: string, scale: number): string;
export declare function resizeViewBox(str: string, scale: number): string;
