import { Blob } from './Blob';
import { GDIContext } from './GDIContext';
import { RectL } from './Primitives';
declare class EmfHeader {
    private size;
    bounds: RectL;
    private frame;
    private nPalEntries;
    private refDevCx;
    private refDevCy;
    private refDevCxMm;
    private refDevCyMm;
    private description;
    displayDevCxUm: number;
    displayDevCyUm: number;
    constructor(reader: Blob, headerSize: number);
    toString(): string;
}
export declare class EMFRecords {
    private _records;
    _header: EmfHeader;
    constructor(reader: Blob, first: number);
    play(gdi: GDIContext): void;
}
export {};
