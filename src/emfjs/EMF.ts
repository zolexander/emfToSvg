import { IRendererSettings, Renderer } from "./Renderer";
import { EMFJSError, Helper } from "./Helper";
import { EMFRecords } from "./EMFRecords";
import { Blob } from "./Blob";
import fs from 'fs';
import { extractGzip,readFileToBlob,toArrayBuffer } from "../emfutils";

export interface EMFConvertResult {
    svg: string;
    returnValue: number;
    height?: number;
    width?: number;
}
export class EMFConverter {
    logger: (message:string,level?: string) => void;
    constructor(logger:(message:string) => void) {
        this.logger = logger;
    }

    private _getSize(reader: Blob) {
        const type = reader.readUint32();
        if (type !== 0x00000001) {
            throw new EMFJSError("Not an EMF file");
        }
        const size = reader.readUint32();
        if (size % 4 !== 0) {
            throw new EMFJSError("Not an EMF file");
        }
        return size;
    }
    private _convert(blob:ArrayBuffer,settings?: IRendererSettings) {
        var renderer = new Renderer(blob);
        const reader = new Blob(blob);
        try {
            var size = this._getSize(reader);
            let records = new EMFRecords(reader,size);
            this.logger(`[EMFHEADER] displayDevXyUM: ${records._header.displayDevCxUm/1000}displayDevCyUm: ${records._header.displayDevCyUm/1000}`)
            this.logger(`[ConvertEMF] ${records._header.toString()}`);
            var result: EMFConvertResult;
            if(!settings) {
                settings={
                    width: `${Math.abs(records._header.bounds.right - records._header.bounds.left)}px`,
                    height: `${Math.abs(records._header.bounds.bottom - records._header.bounds.top)}px`,
                    wExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    hExt:  Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    xExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    yExt: Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    mapMode: 8,
                    endScale: 0.1,
                };
              }
            var svg = renderer.render(settings);
            result= {
                svg: svg,
                returnValue: 0,
                height: settings.hExt,
                width: settings.wExt,
            }
            return result;
        } catch(e) {
            if (e instanceof EMFJSError) {
                this.logger(e.message);
            }

            result = {
                svg: '',
                returnValue: -1
            }
            return result;
        }
    }
    public convertEMFBuffer(buffer:Buffer,settings?: IRendererSettings) {
        let blob = toArrayBuffer(buffer);
        if (settings) return this._convert(blob,settings);
        else return this._convert(blob)
    }
    async convertEmf(inputFile:string,settings?: IRendererSettings) {
        let blob: ArrayBuffer;
           blob = await readFileToBlob(inputFile);
        if(settings) return this._convert(blob,settings);
        else return this._convert(blob);
    }
    async convertEmfToFile(inputFile:string,outFile:string,settings?: IRendererSettings) {
        let result = await this.convertEmf(inputFile,settings);
        if(result.svg && result.returnValue == 0) fs.writeFileSync(outFile,result.svg.toString());
        return result;
    }


    public async convertEMZ(inputFile:string,settings?: IRendererSettings) {
        return extractGzip(inputFile).then((value:Buffer)=>{
            if(settings) return this._convert(toArrayBuffer(value),settings);
            else return this._convert(toArrayBuffer(value))
        })
    }

    public async convertEMZToFile(inputFile:string,outFile:string,settings?: IRendererSettings) {
        let result =  await this.convertEMZ(inputFile,settings);
        if(result.svg) fs.writeFileSync(outFile,result.svg.toString())
        return result;
    }
}
