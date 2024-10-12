import fs from 'fs';
import { Blob } from './Blob';
import { Renderer } from './Renderer';
import { WMFRecords } from './WMFRecords';
import { WMFJSError } from './Helper';
import { Helper } from './Helper';
import { extractGzip, logMessage } from '../emfutils';
export interface WMFConvertResult {
    svg: string;
    returnValue: number;
}

export class WMFConverter {
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

    private _convert(blob:ArrayBuffer) {
        const renderer = new Renderer(blob);
        try {
        let records = renderer._img?.records;
        let placable = renderer._img?._placable.boundingBox
        let settings = placable?.getSettings();
        if(settings){
            logMessage('settings exists');
            var res = renderer.render(settings);
            let result = {
                svg: res,
                returnValue: 0
            }
            return result;
        } else {
            let settings = {
                width: '100px',
                height: '100px',
                xExt: 100,
                yExt: 100,
                mapMode: 8
            }
            let res = renderer.render(settings);
            return {
                svg: res,
                returnValue: 0
            }
        }
        } catch (e) {
            if (e instanceof WMFJSError) {
                console.error(e.message);
            }
            let res = {
                svg: '',
                returnValue: -1
            }
            return res;
        }
    }
    async convertWMF(inputFile:string) {
        let blob = await this._readFileToBlob(inputFile);
        return this._convert(blob);
    }
    async convertWMFToFile(inputFile:string,outFile:string) {
        let result = await this.convertWMF(inputFile);
        if(result && result.svg) fs.writeFileSync(outFile,result.svg.toString());
        return result;
    }

    public async convertWMZ(inputFile:string ) {
        return extractGzip(inputFile).then((value:Buffer)=>{
            return this._convert(this._toArrayBuffer(value));
        })
    }
    public async convertWMZToFile(inputFile:string,outFile:string) {
        let result =  await this.convertWMZ(inputFile);
        if(result && result.svg) fs.writeFileSync(outFile,result.svg.toString())
        return result;
    }
}