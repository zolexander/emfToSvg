export interface IRendererSettings {
    width: string;
    height: string;
    wExt: number;
    hExt: number;
    xExt: number;
    yExt: number;
    endScale: number;
    mapMode: number;
}
export declare class Renderer {
    private _img;
    private _rootElement;
    scale: number;
    constructor(blob: ArrayBuffer);
    render(info: IRendererSettings): string;
    private parse;
    private _render;
}
