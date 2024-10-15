/// <reference types="node" />
import { Writable } from "stream";
export declare class WriteStream extends Writable {
    private stream;
    constructor();
    _write(chunk: any, enc: any, next: any): void;
    getResult(): Buffer;
}
export declare function readFileToBlob(filePath: string): Promise<ArrayBuffer>;
export declare function toArrayBuffer(buffer: Buffer): ArrayBuffer;
export declare function extractGzip(str: string): Promise<Buffer>;
export declare function logMessage(message: any, level?: string): void;
export declare function allowedExtensions(imagetypes: Array<string>, str: string): boolean;
