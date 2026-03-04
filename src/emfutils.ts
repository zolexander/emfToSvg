import fs from 'fs';
import { createGunzip } from 'zlib';
import { Writable } from "stream";
import path from 'path';

let firstRun = true;

export class WriteStream extends Writable {
    private chunks: Buffer[];
    constructor() {
        super();
        this.chunks = [];
    }
    _write(chunk: Buffer | string, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk;
      this.chunks.push(buf);
      callback();
    }
    getResult() {
        return Buffer.concat(this.chunks as unknown as Uint8Array[]);
    }
}
export async function readFileToBlob(filePath: string): Promise<ArrayBuffer> {
    const fileBuffer = await fs.promises.readFile(filePath);
    return toArrayBuffer(fileBuffer);
}

export function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
  }
  return ab;
}

export async function extractGzip(filePath: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const gzipStream = fs.createReadStream(filePath);
        const gunzip = createGunzip();
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
export function logMessage(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const logDir = path.join(__dirname, 'logs');
    const logPath = path.join(logDir, 'app.log');

    if (firstRun) {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, message);
        } else {
            fs.appendFileSync(logPath, message);
        }
        firstRun = false;
    }

    // also print to console with level prefix
    console[level] ? console[level](message) : console.log(message);
    fs.appendFileSync(logPath, message);
}
export function allowedExtensions(imageTypes: string[], fileName: string): boolean {
    return imageTypes.some(ext => fileName.includes(ext));
}
