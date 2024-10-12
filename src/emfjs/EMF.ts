import { IRendererSettings, Renderer } from "../emfjs";
import { EMFJSError, Helper } from "./Helper";
import { EMFRecords } from "./EMFRecords";
import { Blob } from "./Blob";
import fs from 'fs';
import { extractGzip } from "../emfutils";

export interface EMFConvertResult {
    svg: string;
    returnValue: number;
    height?: number;
    width?: number;
}
export class EMFConverter {
    constructor() {}
    private async _readFileToBlob(filePath: string): Promise<ArrayBuffer> {

        const fileBuffer = await fs.promises.readFile(filePath);
        let arrayBuffer = this._toArrayBuffer(fileBuffer);
        return arrayBuffer;
    }
    private _toArrayBuffer(buffer:Buffer) {
        var ab = new ArrayBuffer(buffer.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
        return ab;
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
    private _convert(blob:ArrayBuffer,settings?:IRendererSettings|any) {
        var renderer = new Renderer(blob);
        const reader = new Blob(blob);
        try {
            var size = this._getSize(reader);
            let records = new EMFRecords(reader,size);
            Helper.log(`[EMFHEADER] displayDevXyUM: ${records._header.displayDevCxUm/1000}displayDevCyUm: ${records._header.displayDevCyUm/1000}`)
            Helper.log(`[ConvertEMF] ${records._header.toString()}`);
            var result: EMFConvertResult;
            if(settings && !settings.hasOwnProperty('width') && settings.hasOwnProperty('outFile')) {
                let outPath = settings.outFile;
                settings={
                    width: `${Math.abs(records._header.bounds.right - records._header.bounds.left)}px`,
                    height: `${Math.abs(records._header.bounds.bottom - records._header.bounds.top)}px`,
                    wExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    hExt:  Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    xExt: Math.abs(records._header.bounds.right - records._header.bounds.left),
                    yExt: Math.abs(records._header.bounds.bottom - records._header.bounds.top),
                    mapMode: 8,
                    endScale: 0.1,
                    outFile: outPath
                };
            } else if(!settings) {
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
                Helper.log(e.message);
            }

            result = {
                svg: '',
                returnValue: -1
            }
            return result;
        }
    }
    async convertEmf(inputFile:string|Buffer,settings?: IRendererSettings|{outFile:string}) {
        let blob: ArrayBuffer;
        if(typeof inputFile === 'string'){
           blob = await this._readFileToBlob(inputFile);
        } else {
            blob = this._toArrayBuffer(inputFile);
        } 
        if(settings) return this._convert(blob,settings);
        else return this._convert(blob);
    }
    async convertEmfToFile(inputFile:string,settings: IRendererSettings|{outFile:string}) {
        let result = await this.convertEmf(inputFile,settings);
        if(result.svg) fs.writeFileSync(settings.outFile,result.svg.toString());
        return result;
    }
    
      
    public async convertEMZ(inputFile:string,settings?: IRendererSettings|{outFile:string} ) {
        return extractGzip(inputFile).then((value:Buffer)=>{
            if(settings) return this._convert(this._toArrayBuffer(value),settings);
            else return this._convert(this._toArrayBuffer(value))
        })
    }
    
    public async convertEMZToFile(inputFile:string,settings: IRendererSettings|{outFile:string}) {
        let result =  await this.convertEMZ(inputFile,settings);
        if(result.svg) fs.writeFileSync(settings.outFile,result.svg.toString())
        return result;
    }
}