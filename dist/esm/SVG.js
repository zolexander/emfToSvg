"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVG = exports.SVGPathBuilder = exports.SVGFilters = void 0;
class SVGFilters {
    constructor(rootElement) {
        this._rootElement = rootElement;
    }
    flood(filter, resultId, color, opacity, _settings) {
        const floodElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "feFlood");
        if (resultId && resultId !== null) {
            floodElement.setAttribute("id", resultId);
        }
        floodElement.setAttribute("flood-color", color);
        floodElement.setAttribute("flood-opacity", opacity.toString());
        filter.appendChild(floodElement);
    }
    composite(filter, resultId, in1, in2, k1, k2, k3, k4, _settings) {
        const compositeElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "feComposite");
        if (resultId && resultId !== null) {
            compositeElement.setAttribute("id", resultId);
        }
        compositeElement.setAttribute("in", in1);
        compositeElement.setAttribute("in2", in2);
        filter.appendChild(compositeElement);
    }
}
exports.SVGFilters = SVGFilters;
class SVGPathBuilder {
    constructor() {
        this._path = "";
    }
    copy(str) {
        this._path = str;
    }
    move(x, y) {
        this._path += ` M ${x} ${y}`;
    }
    QBézierCurve(x0, y0, x1, y1) {
        this._path += ` Q ${x0} ${y0} ${x1} ${y1}`;
    }
    path() {
        return this._path.substring(1);
    }
    line(pts) {
        pts.forEach((point) => {
            this._path += ` L ${point[0]} ${point[1]}`;
        });
    }
    movePen(x, y) {
        this._path += ` L ${x} ${y}`;
    }
    curveC(x1, y1, x2, y2, x, y) {
        this._path += ` C ${x1} ${y1} ${x2} ${y2} ${x} ${y}`;
    }
    close() {
        this._path += ` Z`;
    }
}
exports.SVGPathBuilder = SVGPathBuilder;
class SVG {
    constructor(svg, rootElement) {
        this.id = 0;
        this._svg = svg;
        this._rootElement = rootElement;
        this.filters = new SVGFilters(rootElement);
    }
    _appendElement(parent, child) {
        if (parent != null) {
            parent.appendChild(child);
        }
        else {
            this._svg.appendChild(child);
        }
    }
    svg(parent, x, y, width, height, settings) {
        const svgElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.setAttribute("x", x.toString());
        svgElement.setAttribute("y", y.toString());
        svgElement.setAttribute("width", width.toString());
        svgElement.setAttribute("height", height.toString());
        this._appendSettings(settings, svgElement);
        this._appendElement(parent, svgElement);
        return svgElement;
    }
    image(parent, x, y, width, height, url, settings) {
        const imageElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "image");
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
    rect(parent, x, y, width, height, rx, ry, settings) {
        const rectElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "rect");
        rectElement.setAttribute("x", x.toString());
        rectElement.setAttribute("y", y.toString());
        rectElement.setAttribute("width", width.toString());
        rectElement.setAttribute("height", height.toString());
        if (rx !== undefined) {
            if (rx instanceof Number) {
                rectElement.setAttribute("rx", rx.toString());
            }
            else if (rx instanceof Object) {
                this._appendSettings(rx, rectElement);
            }
        }
        if (ry !== undefined) {
            rectElement.setAttribute("ry", ry.toString());
        }
        this._appendSettings(settings, rectElement);
        parent?.appendChild(rectElement);
        return rectElement;
    }
    line(parent, x1, y1, x2, y2, settings) {
        const lineElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "line");
        lineElement.setAttribute("x1", x1.toString());
        lineElement.setAttribute("y1", y1.toString());
        lineElement.setAttribute("x2", x2.toString());
        lineElement.setAttribute("y2", y2.toString());
        this._appendSettings(settings, lineElement);
        parent?.appendChild(lineElement);
        return lineElement;
    }
    polygon(parent, points, settings) {
        const polygonElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygonElement.setAttribute("points", points.map((point) => point.join(",")).join(" "));
        this._appendSettings(settings, polygonElement);
        parent?.appendChild(polygonElement);
        return polygonElement;
    }
    polyline(parent, points, settings) {
        const polylineElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polylineElement.setAttribute("points", points.map((point) => point.join(",")).join(" "));
        this._appendSettings(settings, polylineElement);
        parent?.appendChild(polylineElement);
        return polylineElement;
    }
    ellipse(parent, cx, cy, rx, ry, settings) {
        const ellipseElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipseElement.setAttribute("cx", cx.toString());
        ellipseElement.setAttribute("cy", cy.toString());
        ellipseElement.setAttribute("rx", rx.toString());
        ellipseElement.setAttribute("ry", ry.toString());
        this._appendSettings(settings, ellipseElement);
        parent?.appendChild(ellipseElement);
        return ellipseElement;
    }
    path(parent, builder, settings) {
        const pathElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", builder.path());
        this._appendSettings(settings, pathElement);
        pathElement.setAttribute("id", `path_${this.id}`);
        this.id += 1;
        parent?.appendChild(pathElement);
        return pathElement;
    }
    addPathIfNotExists(parent, builder, settings) {
        const pathElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", builder.path());
        this._appendSettings(settings, pathElement);
        let isFound = false;
        let pathElements = this._rootElement.getElementsByTagName("path");
        for (let i = 0; i < pathElements.length; i++) {
            if (pathElements[i].getAttribute("d") !== builder.path()) {
                continue;
            }
            else {
                isFound = true;
                break;
            }
        }
        if (isFound) {
            pathElement.setAttribute("id", `path_${this.id}`);
            parent?.appendChild(pathElement);
            this.id += 1;
        }
        return pathElement;
    }
    text(parent, x, y, value, settings) {
        const textElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("x", x.toString());
        textElement.setAttribute("y", y.toString());
        this._appendSettings(settings, textElement);
        const textNode = this._rootElement.createTextNode(value);
        textElement.appendChild(textNode);
        parent?.appendChild(textElement);
        return textElement;
    }
    filter(parent, id, x, y, width, height, settings) {
        const filterElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "filter");
        filterElement.setAttribute("x", x.toString());
        filterElement.setAttribute("y", y.toString());
        filterElement.setAttribute("width", width.toString());
        filterElement.setAttribute("height", height.toString());
        this._appendSettings(settings, filterElement);
        parent?.appendChild(filterElement);
        return filterElement;
    }
    pattern(parent, resultId, x, y, width, height, settings) {
        const patternElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "pattern");
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
    defs() {
        if (this._defs === null) {
            const defsElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "defs");
            this._svg.appendChild(defsElement);
            this._defs = defsElement;
        }
        return this._defs;
    }
    clipPath(parent, resultId, units, settings) {
        const clipElement = this._rootElement.createElementNS("http://www.w3.org/2000/svg", "clipPath");
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
    createPath() {
        return new SVGPathBuilder();
    }
    _appendSettings(settings, element) {
        if (settings !== undefined) {
            Object.keys(settings).forEach((key) => {
                element.setAttribute(key, settings[key]);
            });
        }
    }
}
exports.SVG = SVG;
