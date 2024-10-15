import fs from 'fs';
import { createGunzip } from 'zlib';
import { Writable } from "stream";
import path from 'path';

let  firstRun = true;

export class WriteStream extends Writable {
    private stream: Buffer;
    constructor() {
        super();
        this.stream = Buffer.alloc(0);
    }
    _write(chunk:any, enc:any, next:any) {
      this.stream = Buffer.concat([this.stream,chunk]);
      next();
    }
    getResult() {
        return this.stream;
    }
  }
export async function  extractGzip(str: string) {
    return new Promise<Buffer>((resolve,reject) =>{
        const gzipStream = fs.createReadStream(str);
        const gunzip = createGunzip();
        const chunks:any = []
        const write = new WriteStream();
        gzipStream.pipe(gunzip).pipe(write);

        gzipStream.on('error', (err) => {
        logMessage(`Error extracting Gzip: ${err}`);
        reject(err);
        });
        gunzip.on('finish', () => {
        logMessage('Gzip extraction complete!');
        resolve(write.getResult());
        });

    });
}
export function logMessage(message:any,level?:string) {
    var logPath = path.join(__dirname, 'logs','app.log');
    if(firstRun) {
            let directoryPath = path.join(__dirname, 'logs');
            if(!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath);
            }
            if(!fs.existsSync(logPath)) {
                fs.writeFileSync(logPath,message);
            } else {
                fs.appendFileSync(logPath,message)
            }
            firstRun = false;
        }
        console.log(message);
        fs.appendFileSync(logPath,message);
}
export function allowedExtensions(imagetypes:Array<string>,str:string) {
    let result = false;
    imagetypes.forEach(value =>{
        if(str.includes(value)) {
            result =  true;
        }
    });
    return result;
}
