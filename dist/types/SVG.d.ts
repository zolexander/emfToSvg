export declare class SVGFilters {
    private _rootElement;
    constructor(rootElement: any);
    flood(filter: SVGFilterElement, resultId: string | null, color: string, opacity: number, _settings?: any): void;
    composite(filter: SVGFilterElement, resultId: string | null, in1: string | null, in2: string, k1?: number, k2?: number, k3?: number, k4?: number, _settings?: any): void;
}
export declare class SVGPathBuilder {
    private _path;
    copy(str: string): void;
    move(x: number, y: number): void;
    QBézierCurve(x0: number, y0: number, x1: number, y1: number): void;
    path(): string;
    line(pts: number[][]): void;
    movePen(x: number, y: number): void;
    curveC(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
    close(): void;
}
export declare class SVG {
    filters: SVGFilters;
    private _svg;
    private _defs;
    private _rootElement;
    private id;
    constructor(svg: SVGElement, rootElement: any);
    private _appendElement;
    svg(parent: Element | null, x: number, y: number, width: number, height: number, settings?: any): SVGElement;
    image(parent: Element | null, x: number, y: number, width: number, height: number, url: string, settings?: any): SVGImageElement;
    rect(parent: Element | null, x: number, y: number, width: number, height: number, rx?: number, ry?: number, settings?: any): SVGRectElement;
    rect(parent: Element | null, x: number, y: number, width: number, height: number, settings?: any): SVGRectElement;
    line(parent: Element | null, x1: number, y1: number, x2: number, y2: number, settings?: any): SVGLineElement;
    polygon(parent: Element | null, points: number[][], settings?: any): SVGPolygonElement;
    polyline(parent: Element | null, points: number[][], settings?: any): SVGPolylineElement;
    ellipse(parent: Element | null, cx: number, cy: number, rx: number, ry: number, settings?: any): SVGEllipseElement;
    path(parent: SVGElement | null, builder: SVGPathBuilder, settings?: any): SVGPathElement;
    addPathIfNotExists(parent: SVGElement | null, builder: SVGPathBuilder, settings?: any): SVGPathElement;
    text(parent: Element | null, x: number, y: number, value: string, settings?: any): SVGTextElement;
    filter(parent: Element | null, id: string, x: number, y: number, width: number, height: number, settings?: any): SVGFilterElement;
    pattern(parent: Element | null, resultId: string, x: number, y: number, width: number, height: number, settings?: any): SVGPatternElement;
    defs(): SVGDefsElement | null;
    clipPath(parent: Element | null, resultId: string, units?: string, settings?: any): SVGClipPathElement;
    createPath(): SVGPathBuilder;
    private _appendSettings;
}
