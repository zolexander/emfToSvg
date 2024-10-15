"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMFConverter = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */
/* eslint-disable prettier/prettier */
const emfjs_1 = require("../emfjs");
const Helper_1 = require("./Helper");
const EMFRecords_1 = require("./EMFRecords");
const Blob_1 = require("./Blob");
const fs_1 = __importDefault(require("fs"));
const emfutils_1 = require("../emfutils");
class EMFConverter {
    constructor(logger) {
        this.logger = logger;
    }
    async _readFileToBlob(filePath) {
        const fileBuffer = await fs_1.default.promises.readFile(filePath);
        const arrayBuffer = this._toArrayBuffer(fileBuffer);
        return arrayBuffer;
    }
    _toArrayBuffer(buffer) {
        var ab = new ArrayBuffer(buffer.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
        return ab;
    }
    _getSize(reader) {
        const type = reader.readUint32();
        if (type !== 0x00000001) {
            throw new Helper_1.EMFJSError('Not an EMF file');
        }
        const size = reader.readUint32();
        if (size % 4 !== 0) {
            throw new Helper_1.EMFJSError('Not an EMF file');
        }
        return size;
    }
    _convert(blob, settings) {
        var renderer = new emfjs_1.Renderer(blob);
        const reader = new Blob_1.Blob(blob);
        try {
            var size = this._getSize(reader);
            const records = new EMFRecords_1.EMFRecords(reader, size);
            this.logger(`[EMFHEADER] displayDevXyUM: ${records._header.displayDevCxUm / 1000}displayDevCyUm: ${records._header.displayDevCyUm / 1000}`);
            this.logger(`[ConvertEMF] ${records._header.toString()}`);
            var result;
            if (settings && !settings.hasOwnProperty('width') && settings.hasOwnProperty('outFile')) {
                const outPath = settings.outFile;
                settings = {
                    width: `${Math.abs(records._header.bounds.right - records._header.bounds.left)}px`,
                    height: `${Math.abs(records._header.bounds.bottom - records._header.bounds.top)}px`,
                    wExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    hExt: Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    xExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    yExt: Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    mapMode: 8,
                    endScale: 0.1,
                    outFile: outPath
                };
            }
            else if (!settings) {
                settings = {
                    width: `${Math.abs(records._header.bounds.right - records._header.bounds.left)}px`,
                    height: `${Math.abs(records._header.bounds.bottom - records._header.bounds.top)}px`,
                    wExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    hExt: Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    xExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    yExt: Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    mapMode: 8,
                    endScale: 0.1,
                };
            }
            var svg = renderer.render(settings);
            result = {
                svg: svg,
                returnValue: 0,
                height: settings.hExt,
                width: settings.wExt,
            };
            return result;
        }
        catch (e) {
            if (e instanceof Helper_1.EMFJSError) {
                this.logger(e.message);
            }
            result = {
                svg: '',
                returnValue: -1
            };
            return result;
        }
    }
    convertEMFBuffer(buffer, settings) {
        const blob = this._toArrayBuffer(buffer);
        if (settings)
            return this._convert(blob, settings);
        else
            return this._convert(blob);
    }
    async convertEmf(inputFile, settings) {
        const blob = await this._readFileToBlob(inputFile);
        if (settings)
            return this._convert(blob, settings);
        else
            return this._convert(blob);
    }
    async convertEmfToFile(inputFile, settings) {
        const result = await this.convertEmf(inputFile, settings);
        if (result.svg)
            fs_1.default.writeFileSync(settings.outFile, result.svg.toString());
        return result;
    }
    async convertEMZ(inputFile, settings) {
        return (0, emfutils_1.extractGzip)(inputFile).then((value) => {
            if (settings)
                return this._convert(this._toArrayBuffer(value), settings);
            else
                return this._convert(this._toArrayBuffer(value));
        });
    }
    async convertEMZToFile(inputFile, settings) {
        const result = await this.convertEMZ(inputFile, settings);
        if (result.svg)
            fs_1.default.writeFileSync(settings.outFile, result.svg.toString());
        return result;
    }
}
exports.EMFConverter = EMFConverter;
