import fs from 'fs';
import { createGunzip } from 'zlib';
import { Writable } from "stream";
import log from 'electron-log/main';
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
        log.info(`Error extracting Gzip: ${err}`);
        reject(err);
        });
        gunzip.on('finish', () => {
        log.info('Gzip extraction complete!');
        resolve(write.getResult());
        });
        
    });
}
export function logMessage(message:any,level?:string) {
        if(firstRun) {
            log.initialize();
            log.transports.file.level = 'info'; // or 'debug', 'warn', 'error', or 'silly'
            let directoryPath = path.join(__dirname, 'logs');
            if(!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath);
            }
             
            log.transports.file.resolvePathFn = () =>{
                return path.join(directoryPath,'app.log');
            }
            firstRun = false;
        }
        if(level == 'debug') log.debug(message)
        log.info(message)
    
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