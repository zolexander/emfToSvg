/* eslint-disable prettier/prettier */
/*

The MIT License (MIT)

Copyright (c) 2015 Thomas Bluemel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { SVG } from '../SVG'
import { Blob } from './Blob'
import { GDIContext } from './GDIContext'
import { Helper, WMFJSError } from './Helper'
import { WMFRecords } from './WMFRecords'
import { HTMLElement, parse, }  from 'node-html-parser'
import fs from 'fs'
export interface IRendererSettings {
    width: string;
    height: string;
    xExt: number;
    yExt: number;
    mapMode: number;
}

export class Renderer {
    public _img: WMF|null;
    private _rootElement: HTMLElement;

    constructor(blob: ArrayBuffer) {
        this.parse(blob);
        this._rootElement = parse('<div></div>',{
            lowerCaseTagName: false,
            comment: true ,
            voidTag:{
                tags: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr','p'],	// optional and case insensitive, default value is ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
                closingSlash: true
              },
        });
        Helper.log('WMFJS.Renderer instantiated');
    }

    public render(info: IRendererSettings) {
        const svgElement:any = this._rootElement.createElementNS('http://www.w3.org/2000/svg', 'svg');

        this._render(
            new SVG(svgElement,this._rootElement),
            info.mapMode,
            info.xExt,
            info.yExt
        );
        svgElement.setAttribute('viewBox', [0, 0, Math.abs(info.xExt), Math.abs(info.yExt)].join(' '));
        svgElement.setAttribute('preserveAspectRatio', 'none'); // TODO: MM_ISOTROPIC vs MM_ANISOTROPIC
        svgElement.setAttribute('width', Math.abs(parseFloat(info.width)));
        svgElement.setAttribute('height', Math.abs(parseFloat(info.height)));
        const svgString =`<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n ${svgElement.toString().replace(/<svg\s+[^>]*>/,'').replace('</svg>','').replaceAll('-','')}`;
        return svgString;
    }

    private parse(blob: ArrayBuffer) {
        this._img = null;

        const reader = new Blob(blob);

        let type;
        let size;
        let placable;
        let headerstart;
        const key = reader.readUint32();
        if (key === 0x9ac6cdd7) {
            placable = new WMFPlacable(reader);
            headerstart = reader.pos;
            type = reader.readUint16();
            size = reader.readUint16();
        } else {
            headerstart = 0;
            type = key & 0xffff;
            size = (key >>> 16) & 0xffff;
        }
        switch (type) {
            case Helper.GDI.MetafileType.MEMORYMETAFILE:
            case Helper.GDI.MetafileType.DISKMETAFILE:
                if (size === Helper.GDI.METAHEADER_SIZE / 2) {
                    const version = reader.readUint16();
                    switch (version) {
                        case Helper.GDI.MetafileVersion.METAVERSION100:
                        case Helper.GDI.MetafileVersion.METAVERSION300:
                            if(placable) this._img = new WMF(reader, placable, version, headerstart + (size * 2));
                            break;
                    }
                }
                break;
        }

        if (this._img == null) {
            throw new WMFJSError('Format not recognized');
        }
    }

    private _render(svg: SVG, mapMode: number, xExt: number, yExt: number) {
        // See https://www-user.tu-chemnitz.de/~ygu/petzold/ch18b.htm
        const gdi = new GDIContext(svg);
        gdi.setViewportExt(xExt, yExt);
        gdi.setMapMode(mapMode);
        Helper.log('[WMF] BEGIN RENDERING --->');
        if(this._img) this._img.render(gdi);
        Helper.log('[WMF] <--- DONE RENDERING');
    }
}

class WMFRect16 {
    private left: number;
    private top: number;
    private right: number;
    private bottom: number;

    constructor(reader: Blob) {
        this.left = reader.readInt16();
        this.top = reader.readInt16();
        this.right = reader.readInt16();
        this.bottom = reader.readInt16();
    }
    public getSettings() {
        const settings: IRendererSettings = {
            width: (this.right -this.left).toFixed(2),
            height: (this.top -this.bottom).toFixed(2),
            xExt: (this.right -this.left),
            yExt: (this.top -this.bottom),
            mapMode: 8
        }
        return settings;
    }
    public toString(): string {
        return '{left: ' + this.left + ', top: ' + this.top + ', right: ' + this.right
            + ', bottom: ' + this.bottom + '}';
    }
}

class WMFPlacable {
    public boundingBox: WMFRect16;
    private unitsPerInch: number;

    constructor(reader: Blob) {
        reader.skip(2);
        this.boundingBox = new WMFRect16(reader);
        this.unitsPerInch = reader.readInt16();
        reader.skip(4);
        reader.skip(2); // TODO: checksum
        Helper.log('Got bounding box ' + this.boundingBox + ' and ' + this.unitsPerInch + ' units/inch');
    }
}

class WMF {
    private _version: number;
    private _hdrsize: number;
    public _placable: WMFPlacable;
    public records: WMFRecords;

    constructor(reader: Blob, placable: WMFPlacable, version: number, hdrsize: number) {
        this._version = version;
        this._hdrsize = hdrsize;
        this._placable = placable;
        this.records = new WMFRecords(reader, this._hdrsize);
    }

    public render(gdi: GDIContext): void {
        this.records.play(gdi);
    }
}
