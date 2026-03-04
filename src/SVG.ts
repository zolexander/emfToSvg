/*

The MIT License (MIT)

Copyright (c) 2020 Ynse Hoornenborg

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

import { HTMLElement } from "./utils/node_html_parser_extended";

type Attrs = Record<string, string | number | boolean | null | undefined>;
type Settings = Attrs | undefined;

export class SVGFilters {
    private _rootElement: HTMLElement;

    constructor(rootElement: HTMLElement) {
        this._rootElement = rootElement;
    }


    public flood(filter: SVGFilterElement, resultId: string | null, color: string, opacity: number, _settings?: any): void {
        const floodElement = this._rootElement.createElement<SVGFEFloodElement>("feFlood", "http://www.w3.org/2000/svg");
        if (resultId) {
            floodElement.setAttribute("id", resultId);
        }
        floodElement.setAttribute("flood-color", color);
        floodElement.setAttribute("flood-opacity", opacity.toString());
        filter.appendChild(floodElement);
    }

    public composite(
        filter: SVGFilterElement,
        resultId: string | null,
        in1: string | null,
        in2: string,
        k1?: number,
        k2?: number,
        k3?: number,
        k4?: number,
        _settings?: any
    ): void {
        const compositeElement = this._rootElement.createElement<SVGFECompositeElement>("feComposite", "http://www.w3.org/2000/svg");
        if (resultId) {
            compositeElement.setAttribute("id", resultId);
        }
        if (in1) {
            compositeElement.setAttribute("in", in1);
        }
        compositeElement.setAttribute("in2", in2);
        filter.appendChild(compositeElement);
    }
}

export class SVGPathBuilder {
    private _path = "";

    public copy(str: string): void {
        this._path = str;
    }
    public move(x: number, y: number): void {
        this._path += ` M ${x} ${y}`;
    }
    public QBézierCurve(x0: number, y0: number, x1: number, y1: number): void {
        this._path += ` Q ${x0} ${y0} ${x1} ${y1}`;
    }
    public path(): string {
        return this._path.substring(1);
    }
    public line(pts: number[][]): void {
        pts.forEach((point) => {
            this._path += ` L ${point[0]} ${point[1]}`;
        });
    }
    public movePen(x: number, y: number): void {
        this._path += ` L ${x} ${y}`;
    }
    public curveC(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
        this._path += ` C ${x1} ${y1} ${x2} ${y2} ${x} ${y}`;
    }
    public close(): void {
        this._path += ` Z`;
    }
}

export class SVG {
    public filters: SVGFilters;
    private _svg: SVGElement;
    private _defs: SVGDefsElement | null = null;
    private _rootElement: HTMLElement;
    private id = 0;

    constructor(svg: SVGElement, rootElement: HTMLElement) {
        this._svg = svg;
        this._rootElement = rootElement;
        this.filters = new SVGFilters(rootElement);
    }



    private _appendElement(parent: Element | null, child: Element): void {
        if (parent) {
            parent.appendChild(child);
        } else {
            this._svg.appendChild(child);
        }
    }

    private _appendSettings(settings: Settings, element: HTMLElement): void {
        if (!settings) {
            return;
        }
        for (const [key, value] of Object.entries(settings)) {
            if (value != null) {
                element.setAttribute(key, String(value));
            }
        }
    }

    public svg(
        parent: Element | null,
        x: number,
        y: number,
        width: number,
        height: number,
        settings?: Settings
    ): SVGElement {
        const svgElement = this._rootElement.createElement<SVGSVGElement>("svg", "http://www.w3.org/2000/svg");
        svgElement.setAttribute("x", String(x));
        svgElement.setAttribute("y", String(y));
        svgElement.setAttribute("width", String(width));
        svgElement.setAttribute("height", String(height));

        this._appendSettings(settings, svgElement as unknown as HTMLElement);
        this._appendElement(parent, svgElement);

        return svgElement;
    }

    public image(
        parent: Element | null,
        x: number,
        y: number,
        width: number,
        height: number,
        url: string,
        settings?: Settings
    ): SVGImageElement {
        const imageElement = this._rootElement.createElement<SVGImageElement>("image", "http://www.w3.org/2000/svg");
        imageElement.setAttribute("x", String(x));
        imageElement.setAttribute("y", String(y));
        imageElement.setAttribute("width", String(width));
        imageElement.setAttribute("height", String(height));
        imageElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);

        this._appendSettings(settings, imageElement as unknown as HTMLElement);
        this._appendElement(parent, imageElement);
        return imageElement;
    }

    public rect(
        parent: Element | null,
        x: number,
        y: number,
        width: number,
        height: number,
        rx?: number,
        ry?: number,
        settings?: Settings
    ): SVGRectElement;
    public rect(
        parent: Element | null,
        x: number,
        y: number,
        width: number,
        height: number,
        settings?: Settings
    ): SVGRectElement;
    public rect(
        parent: Element | null,
        x: number,
        y: number,
        width: number,
        height: number,
        rxOrSettings?: number | Settings,
        ry?: number,
        settings?: Settings
    ): SVGRectElement {
        const rectElement = this._rootElement.createElement<SVGRectElement>("rect", "http://www.w3.org/2000/svg");
        rectElement.setAttribute("x", String(x));
        rectElement.setAttribute("y", String(y));
        rectElement.setAttribute("width", String(width));
        rectElement.setAttribute("height", String(height));

        if (typeof rxOrSettings === "number") {
            rectElement.setAttribute("rx", String(rxOrSettings));
            if (ry !== undefined) {
                rectElement.setAttribute("ry", String(ry));
            }
            this._appendSettings(settings, rectElement as unknown as HTMLElement);
        } else {
            this._appendSettings(rxOrSettings, rectElement as unknown as HTMLElement);
        }

        this._appendElement(parent, rectElement);
        return rectElement;
    }

    public line(
        parent: Element | null,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        settings?: Settings
    ): SVGLineElement {
        const lineElement = this._rootElement.createElement<SVGLineElement>("line", "http://www.w3.org/2000/svg");
        lineElement.setAttribute("x1", String(x1));
        lineElement.setAttribute("y1", String(y1));
        lineElement.setAttribute("x2", String(x2));
        lineElement.setAttribute("y2", String(y2));

        this._appendSettings(settings, lineElement as unknown as HTMLElement);
        this._appendElement(parent, lineElement);
        return lineElement;
    }

    public polygon(
        parent: Element | null,
        points: number[][],
        settings?: Settings
    ): SVGPolygonElement {
        const polygonElement = this._rootElement.createElement<SVGPolygonElement>("polygon", "http://www.w3.org/2000/svg");
        polygonElement.setAttribute(
            "points",
            points.map((point) => point.join(",")).join(" ")
        );

        this._appendSettings(settings, polygonElement as unknown as HTMLElement);
        this._appendElement(parent, polygonElement);
        return polygonElement;
    }

    public polyline(
        parent: Element | null,
        points: number[][],
        settings?: Settings
    ): SVGPolylineElement {
        const polylineElement = this._rootElement.createElement<SVGPolylineElement>("polyline", "http://www.w3.org/2000/svg");
        polylineElement.setAttribute(
            "points",
            points.map((point) => point.join(",")).join(" ")
        );

        this._appendSettings(settings, polylineElement as unknown as HTMLElement);
        this._appendElement(parent, polylineElement);
        return polylineElement;
    }

    public ellipse(
        parent: Element | null,
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        settings?: Settings
    ): SVGEllipseElement {
        const ellipseElement = this._rootElement.createElement<SVGEllipseElement>("ellipse", "http://www.w3.org/2000/svg");
        ellipseElement.setAttribute("cx", String(cx));
        ellipseElement.setAttribute("cy", String(cy));
        ellipseElement.setAttribute("rx", String(rx));
        ellipseElement.setAttribute("ry", String(ry));

        this._appendSettings(settings, ellipseElement as unknown as HTMLElement);
        this._appendElement(parent, ellipseElement);
        return ellipseElement;
    }

    public path(
        parent: SVGElement | null,
        builder: SVGPathBuilder,
        settings?: Settings
    ): SVGPathElement {
        const pathElement = this._rootElement.createElement<SVGPathElement>("path", "http://www.w3.org/2000/svg");
        pathElement.setAttribute("d", builder.path());

        this._appendSettings(settings, pathElement as unknown as HTMLElement);
        pathElement.setAttribute("id", `path_${this.id++}`);
        this._appendElement(parent, pathElement);
        return pathElement;
    }

    public addPathIfNotExists(
        parent: SVGElement | null,
        builder: SVGPathBuilder,
        settings?: Settings
    ): SVGPathElement {
        const d = builder.path();
        let existing: SVGPathElement | null = null;
        if (parent) {
            existing = parent.querySelector(`path[d="${d}"]`) as SVGPathElement | null;
        }
        if (existing) {
            return existing;
        }
        return this.path(parent, builder, settings);
    }

    public text(
        parent: Element | null,
        x: number,
        y: number,
        value: string,
        settings?: Settings
    ): SVGTextElement {
        const textElement = this._rootElement.createElement<SVGTextElement>("text", "http://www.w3.org/2000/svg");
        textElement.setAttribute("x", String(x));
        textElement.setAttribute("y", String(y));
        textElement.textContent = value;

        this._appendSettings(settings, textElement as unknown as HTMLElement);
        this._appendElement(parent, textElement);
        return textElement;
    }

    public filter(
        parent: Element | null,
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        settings?: Settings
    ): SVGFilterElement {
        const filterElement = this._rootElement.createElement<SVGFilterElement>("filter", "http://www.w3.org/2000/svg");
        filterElement.setAttribute("id", id);
        filterElement.setAttribute("x", String(x));
        filterElement.setAttribute("y", String(y));
        filterElement.setAttribute("width", String(width));
        filterElement.setAttribute("height", String(height));
        this._appendSettings(settings, filterElement as unknown as HTMLElement);
        this._appendElement(parent, filterElement);
        return filterElement;
    }

    public pattern(
        parent: Element | null,
        resultId: string,
        x: number,
        y: number,
        width: number,
        height: number,
        settings?: Settings
    ): SVGPatternElement {
        const patternElement = this._rootElement.createElement<SVGPatternElement>("pattern", "http://www.w3.org/2000/svg");
        patternElement.setAttribute("id", resultId);
        patternElement.setAttribute("x", String(x));
        patternElement.setAttribute("y", String(y));
        patternElement.setAttribute("width", String(width));
        patternElement.setAttribute("height", String(height));
        this._appendSettings(settings, patternElement as unknown as HTMLElement);
        this._appendElement(parent, patternElement);
        return patternElement;
    }

    public defs(): SVGDefsElement | null {
        if (!this._defs) {
            this._defs = this._rootElement.createElement<SVGDefsElement>("defs", "http://www.w3.org/2000/svg");
            this._appendElement(null, this._defs);
        }
        return this._defs;
    }

    public clipPath(
        parent: Element | null,
        resultId: string,
        units?: string,
        settings?: Settings
    ): SVGClipPathElement {
        const clipElement = this._rootElement.createElement<SVGClipPathElement>("clipPath", "http://www.w3.org/2000/svg");
        clipElement.setAttribute("id", resultId);
        if (units) {
            clipElement.setAttribute("clipPathUnits", units);
        }
        this._appendSettings(settings, clipElement as unknown as HTMLElement);
        this._appendElement(parent, clipElement);
        return clipElement;
    }

    public createPath(): SVGPathBuilder {
        return new SVGPathBuilder();
    }
}
