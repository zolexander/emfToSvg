"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WMFConverter = void 0;
const fs_1 = __importDefault(require("fs"));
const Renderer_1 = require("./Renderer");
const Helper_1 = require("./Helper");
const emfutils_1 = require("../emfutils");
class WMFConverter {
    constructor(logger) {
        this.logger = logger;
    }
    async _readFileToBlob(filePath) {
        const fileBuffer = await fs_1.default.promises.readFile(filePath);
        let arrayBuffer = this._toArrayBuffer(fileBuffer);
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
    _convert(blob) {
        const renderer = new Renderer_1.Renderer(blob);
        try {
            let records = renderer._img?.records;
            let placable = renderer._img?._placable.boundingBox;
            let settings = placable?.getSettings();
            if (settings) {
                this.logger('settings exists');
                var res = renderer.render(settings);
                let result = {
                    svg: res,
                    returnValue: 0
                };
                return result;
            }
            else {
                let settings = {
                    width: '100px',
                    height: '100px',
                    xExt: 100,
                    yExt: 100,
                    mapMode: 8
                };
                let res = renderer.render(settings);
                return {
                    svg: res,
                    returnValue: 0
                };
            }
        }
        catch (e) {
            if (e instanceof Helper_1.WMFJSError) {
                this.logger(e.message);
            }
            let res = {
                svg: '',
                returnValue: -1
            };
            return res;
        }
    }
    async convertWMF(inputFile) {
        let blob = await this._readFileToBlob(inputFile);
        return this._convert(blob);
    }
    async convertWMFToFile(inputFile, outFile) {
        let result = await this.convertWMF(inputFile);
        if (result && result.svg)
            fs_1.default.writeFileSync(outFile, result.svg.toString());
        return result;
    }
    async convertWMZ(inputFile) {
        return (0, emfutils_1.extractGzip)(inputFile).then((value) => {
            return this._convert(this._toArrayBuffer(value));
        });
    }
    async convertWMZToFile(inputFile, outFile) {
        let result = await this.convertWMZ(inputFile);
        if (result && result.svg)
            fs_1.default.writeFileSync(outFile, result.svg.toString());
        return result;
    }
}
exports.WMFConverter = WMFConverter;
