/// <reference types="node" />
import { IRendererSettings } from "../emfjs";
export interface EMFConvertResult {
    svg: string;
    returnValue: number;
    height?: number;
    width?: number;
}
export declare class EMFConverter {
    logger: (message: string, level?: string) => void;
    constructor(logger: (message: string) => void);
    private _readFileToBlob;
    private _toArrayBuffer;
    private _getSize;
    private _convert;
    convertEMFBuffer(buffer: Buffer, settings?: IRendererSettings | {
        outFile: string;
    }): EMFConvertResult;
    convertEmf(inputFile: string, settings?: IRendererSettings | {
        outFile: string;
    }): Promise<EMFConvertResult>;
    convertEmfToFile(inputFile: string, settings: IRendererSettings | {
        outFile: string;
    }): Promise<EMFConvertResult>;
    convertEMZ(inputFile: string, settings?: IRendererSettings | {
        outFile: string;
    }): Promise<EMFConvertResult>;
    convertEMZToFile(inputFile: string, settings: IRendererSettings | {
        outFile: string;
    }): Promise<EMFConvertResult>;
}
