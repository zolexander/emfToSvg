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

import { HTMLElement } from "node-html-parser";
export class SVGFilters {
    private _rootElement: HTMLElement;
    constructor(rootElement: any) {
        this._rootElement = rootElement;
    }
    public flood(filter: SVGFilterElement, resultId: string|null, color: string, opacity: number, _settings?: any): void {
        const floodElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "feFlood");
        if (resultId && resultId !== null) {
            floodElement.setAttribute("id", resultId);
        }
        floodElement.setAttribute("flood-color", color);
        floodElement.setAttribute("flood-opacity", opacity.toString());
        filter.appendChild(floodElement);
    }

    public composite(filter: SVGFilterElement,
                     resultId: string|null,
                     in1: string|null,
                     in2: string,
                     k1?: number,
                     k2?: number,
                     k3?: number,
                     k4?: number,
                     _settings?: any): void {
        const compositeElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "feComposite");
        if (resultId && resultId !== null) {
            compositeElement.setAttribute("id", resultId);
        }
        compositeElement.setAttribute("in", in1);
        compositeElement.setAttribute("in2", in2);
        filter.appendChild(compositeElement);
    }
}

export class SVGPathBuilder {
    private _path = "";

    public copy(str: string) {
        this._path = str;
    }
    public move(x: number, y: number): void {
        this._path += ` M ${x} ${y}`;
    }
    public QBézierCurve(x0:number,y0:number,x1:number,y1:number) {
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

    public movePen(x:number,y:number) {
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
    public filters:SVGFilters;
    private _svg: SVGElement;
    private _defs: SVGDefsElement | null;
    private _rootElement: HTMLElement;
    private id: number = 0;
    constructor(svg: SVGElement,rootElement: any) {
        this._svg = svg;
        this._rootElement = rootElement;
        this.filters = new SVGFilters(rootElement);
    }
    private _appendElement(parent:Element|null,child:any) {
        if (parent != null) {
            parent.appendChild(child);
        } else {
            this._svg.appendChild(child);
        }

    }
    public svg(parent: Element|null,
               x: number,
               y: number,
               width: number,
               height: number,
               settings?: any
              ): SVGElement {
        const svgElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute("x", x.toString());
        svgElement.setAttribute("y", y.toString());
        svgElement.setAttribute("width", width.toString());
        svgElement.setAttribute("height", height.toString());
        

        this._appendSettings(settings, svgElement);

        this._appendElement(parent,svgElement);

        return svgElement;
    }

    public image(parent: Element|null,
                 x: number,
                 y: number,
                 width: number,
                 height: number,
                 url: string,
                 settings?: any): SVGImageElement {
        const imageElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "image");
        imageElement.setAttribute("x", x.toString());
        imageElement.setAttribute("y", y.toString());
        imageElement.setAttribute("width", width.toString());
        imageElement.setAttribute("height", height.toString());
        imageElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
        

        this._appendSettings(settings, imageElement);
        parent?.appendChild(imageElement);
        //this._appendElement(parent,imageElement)
        return imageElement;
    }

    public rect(parent: Element|null,
                x: number,
                y: number,
                width: number,
                height: number,
                rx?: number,
                ry?: number,
                settings?: any): SVGRectElement;
    public rect(parent: Element|null, x: number, y: number, width: number, height: number, settings?: any): SVGRectElement;
    public rect(parent: Element|null,
                x: number,
                y: number,
                width: number,
                height: number,
                rx?: number | any,
                ry?: number,
                settings?: any): SVGRectElement {
        const rectElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "rect");
        rectElement.setAttribute("x", x.toString());
        rectElement.setAttribute("y", y.toString());
        rectElement.setAttribute("width", width.toString());
        rectElement.setAttribute("height", height.toString());
        if (rx !== undefined) {
            if (rx instanceof Number) {
                rectElement.setAttribute("rx", rx.toString());
            } else if (rx instanceof Object) {
                this._appendSettings(rx, rectElement);
            }
        }
        if (ry !== undefined) {
            rectElement.setAttribute("ry", ry.toString());
        }
        
        this._appendSettings(settings, rectElement);
        parent?.appendChild(rectElement)
        return rectElement;
    }

    public line(parent: Element|null, x1: number, y1: number, x2: number, y2: number, settings?: any): SVGLineElement {
        const lineElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "line");
        lineElement.setAttribute("x1", x1.toString());
        lineElement.setAttribute("y1", y1.toString());
        lineElement.setAttribute("x2", x2.toString());
        lineElement.setAttribute("y2", y2.toString());
        

        this._appendSettings(settings, lineElement);
        parent?.appendChild(lineElement);
        return lineElement;
    }

    public polygon(parent: Element|null, points: number[][], settings?: any): SVGPolygonElement {
        const polygonElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygonElement.setAttribute("points", points.map((point) => point.join(",")).join(" "));
        

        this._appendSettings(settings, polygonElement);
        parent?.appendChild(polygonElement);
        return polygonElement;
    }

    public polyline(parent: Element|null, points: number[][], settings?: any): SVGPolylineElement {
        const polylineElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polylineElement.setAttribute("points", points.map((point) => point.join(",")).join(" "));
        

        this._appendSettings(settings, polylineElement);
        parent?.appendChild(polylineElement);
        return polylineElement;
    }

    public ellipse(parent: Element|null, cx: number, cy: number, rx: number, ry: number, settings?: any): SVGEllipseElement {
        const ellipseElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipseElement.setAttribute("cx", cx.toString());
        ellipseElement.setAttribute("cy", cy.toString());
        ellipseElement.setAttribute("rx", rx.toString());
        ellipseElement.setAttribute("ry", ry.toString());
        

        this._appendSettings(settings, ellipseElement);
        parent?.appendChild(ellipseElement);
        return ellipseElement;
    }

    public path(parent: SVGElement|null, builder: SVGPathBuilder, settings?: any): SVGPathElement {
        const pathElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", builder.path());
    
        this._appendSettings(settings, pathElement);
        pathElement.setAttribute("id",`path_${this.id}`)
        this.id +=1;
        parent?.appendChild(pathElement);
        return pathElement;
    }
    public addPathIfNotExists(parent: SVGElement|null, builder: SVGPathBuilder, settings?: any): SVGPathElement {
        const pathElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", builder.path());
        this._appendSettings(settings, pathElement);
        let isFound = false
        let pathElements = this._rootElement.getElementsByTagName("path");
        for(let i= 0; i< pathElements.length;i++) {
            if(pathElements[i].getAttribute("d") !== builder.path()) {
                continue;
            } else {
                isFound = true;
                break;
            }
        }

        if(isFound) {
            pathElement.setAttribute("id",`path_${this.id}`)
            parent?.appendChild(pathElement);
            this.id +=1;
        }
        return pathElement;
    }

    public text(parent: Element|null, x: number, y: number, value: string, settings?: any): SVGTextElement {
        const textElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("x", x.toString());
        textElement.setAttribute("y", y.toString());
        

        this._appendSettings(settings, textElement);
        const textNode = this._rootElement.createTextNode(value);
        textElement.appendChild(textNode);
        parent?.appendChild(textElement);
        return textElement;
    }

    public filter(parent: Element|null,
                  id: string,
                  x: number,
                  y: number,
                  width: number,
                  height: number,
                  settings?: any): SVGFilterElement {
        const filterElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "filter");
        filterElement.setAttribute("x", x.toString());
        filterElement.setAttribute("y", y.toString());
        filterElement.setAttribute("width", width.toString());
        filterElement.setAttribute("height", height.toString());
        

        this._appendSettings(settings, filterElement);
        parent?.appendChild(filterElement);
        return filterElement;
    }

    public pattern(parent: Element|null,
                   resultId: string,
                   x: number,
                   y: number,
                   width: number,
                   height: number,
                   settings?: any): SVGPatternElement {
        const patternElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "pattern");
        if (resultId) {
            patternElement.setAttribute("id", resultId);
        }
        patternElement.setAttribute("x", x.toString());
        patternElement.setAttribute("y", y.toString());
        patternElement.setAttribute("width", width.toString());
        patternElement.setAttribute("height", height.toString());
        

        this._appendSettings(settings, patternElement);
        parent?.appendChild(patternElement);
        return patternElement;
    }

    public defs(): SVGDefsElement|null {
        if (this._defs === null) {
            const defsElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "defs");
            
            this._svg.appendChild(defsElement);
            this._defs = defsElement;
        }
        return this._defs;
    }

    public clipPath(parent: Element|null, resultId: string, units?: string, settings?: any): SVGClipPathElement {
        const clipElement:any = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        if (resultId) {
            clipElement.setAttribute("id", resultId);
        }
        if (units === undefined) {
            units = "userSpaceOnUse";
        }
        clipElement.setAttribute("clipPathUnits", units);
        

        this._appendSettings(settings, clipElement);
        parent?.appendChild(clipElement);
        return clipElement;
    }

    public createPath(): SVGPathBuilder {
        return new SVGPathBuilder();
    }

    private _appendSettings(settings: any | undefined, element: Element): void {
        if (settings !== undefined) {
            Object.keys(settings).forEach((key) => {
                element.setAttribute(key, settings[key]);
            });
        }
    }

}
