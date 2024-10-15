/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */
/* eslint-disable prettier/prettier */
import fs from 'fs'
import { Blob } from './Blob'
import { Renderer } from './Renderer'
import { WMFRecords } from './WMFRecords'
import { WMFJSError } from './Helper'
import { Helper } from './Helper'
import { extractGzip } from '../emfutils'
export interface WMFConvertResult {
    svg: string;
    returnValue: number;
}

export class WMFConverter {
    logger: (message:string,level?:string) => void;
    constructor(logger : (message:string,level?:string)=> void) {
        this.logger = logger
    }
    private async _readFileToBlob(filePath: string): Promise<ArrayBuffer> {

        const fileBuffer = await fs.promises.readFile(filePath);
        const arrayBuffer = this._toArrayBuffer(fileBuffer);
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

    private _convert(blob:ArrayBuffer) {
        const renderer = new Renderer(blob);
        try {
        const records = renderer._img?.records;
        const placable = renderer._img?._placable.boundingBox
        const settings = placable?.getSettings();
        if(settings){
            this.logger('settings exists');
            var res = renderer.render(settings);
            const result = {
                svg: res,
                returnValue: 0
            }
            return result;
        } else {
            const settings = {
                width: '100px',
                height: '100px',
                xExt: 100,
                yExt: 100,
                mapMode: 8
            }
            const res = renderer.render(settings);
            return {
                svg: res,
                returnValue: 0
            }
        }
        } catch (e) {
            if (e instanceof WMFJSError) {
                this.logger(e.message);
            }
            const res = {
                svg: '',
                returnValue: -1
            }
            return res;
        }
    }
    async convertWMF(inputFile:string): Promise<{ svg:string,returnValue:number }> {
        const blob = await this._readFileToBlob(inputFile);
        return this._convert(blob);
    }
    async convertWMFToFile(inputFile:string,outFile:string): Promise<{svg:string,returnValue:number}> {
        const result = await this.convertWMF(inputFile);
        if(result && result.svg) fs.writeFileSync(outFile,result.svg.toString());
        return result;
    }

    public async convertWMZ(inputFile:string ):Promise<any> {
        return extractGzip(inputFile).then((value:Buffer)=>{
            return this._convert(this._toArrayBuffer(value));
        })
    }
    public async convertWMZToFile(inputFile:string,outFile:string):Promise<any> {
        const result =  await this.convertWMZ(inputFile);
        if(result && result.svg) fs.writeFileSync(outFile,result.svg.toString())
        return result;
    }
}
