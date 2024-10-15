import fs from 'fs';
import { Blob } from './Blob';
import { Renderer } from './Renderer';
import { WMFRecords } from './WMFRecords';
import { WMFJSError } from './Helper';
import { Helper } from './Helper';
import { extractGzip,toArrayBuffer,readFileToBlob } from '../emfutils';
export interface WMFConvertResult {
    svg: string;
    returnValue: number;
}

export class WMFConverter {
    logger: (message:string,level?:string) => void;
    constructor(logger : (message:string,level?:string)=> void) {
        this.logger = logger
    }

    private _convert(blob:ArrayBuffer) {
        const renderer = new Renderer(blob);
        try {
        let records = renderer._img?.records;
        let placable = renderer._img?._placable.boundingBox
        let settings = placable?.getSettings();
        if(settings){
            this.logger('settings exists');
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
                this.logger(e.message);
            }
            let res = {
                svg: '',
                returnValue: -1
            }
            return res;
        }
    }
    async convertWMF(inputFile:string) {
        let blob = await readFileToBlob(inputFile);
        return this._convert(blob);
    }
    async convertWMFToFile(inputFile:string,outFile:string) {
        let result = await this.convertWMF(inputFile);
        if(result && result.svg) fs.writeFileSync(outFile,result.svg.toString());
        return result;
    }

    public async convertWMZ(inputFile:string ) {
        return extractGzip(inputFile).then((value:Buffer)=>{
            return this._convert(toArrayBuffer(value));
        })
    }
    public async convertWMZToFile(inputFile:string,outFile:string) {
        let result =  await this.convertWMZ(inputFile);
        if(result && result.svg) fs.writeFileSync(outFile,result.svg.toString())
        return result;
    }
}
