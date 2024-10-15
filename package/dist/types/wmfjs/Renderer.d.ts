import { Blob } from './Blob';
import { GDIContext } from './GDIContext';
import { WMFRecords } from './WMFRecords';
export interface IRendererSettings {
    width: string;
    height: string;
    xExt: number;
    yExt: number;
    mapMode: number;
}
export declare class Renderer {
    _img: WMF | null;
    private _rootElement;
    constructor(blob: ArrayBuffer);
    render(info: IRendererSettings): string;
    private parse;
    private _render;
}
declare class WMFRect16 {
    private left;
    private top;
    private right;
    private bottom;
    constructor(reader: Blob);
    getSettings(): IRendererSettings;
    toString(): string;
}
declare class WMFPlacable {
    boundingBox: WMFRect16;
    private unitsPerInch;
    constructor(reader: Blob);
}
declare class WMF {
    private _version;
    private _hdrsize;
    _placable: WMFPlacable;
    records: WMFRecords;
    constructor(reader: Blob, placable: WMFPlacable, version: number, hdrsize: number);
    render(gdi: GDIContext): void;
}
export {};
