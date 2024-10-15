/// <reference types="node" />
import { IRendererSettings } from "./Renderer";
export interface EMFConvertResult {
    svg: string;
    returnValue: number;
    height?: number;
    width?: number;
}
export declare class EMFConverter {
    logger: (message: string, level?: string) => void;
    constructor(logger: (message: string) => void);
    private _getSize;
    private _convert;
    convertEMFBuffer(buffer: Buffer, settings?: IRendererSettings): EMFConvertResult;
    convertEmf(inputFile: string, settings?: IRendererSettings): Promise<EMFConvertResult>;
    convertEmfToFile(inputFile: string, outFile: string, settings: IRendererSettings): Promise<EMFConvertResult>;
    convertEMZ(inputFile: string, settings?: IRendererSettings): Promise<EMFConvertResult>;
    convertEMZToFile(inputFile: string, outFile: string, settings: IRendererSettings): Promise<EMFConvertResult>;
}
