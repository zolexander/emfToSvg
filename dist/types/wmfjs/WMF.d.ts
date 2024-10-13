export interface WMFConvertResult {
    svg: string;
    returnValue: number;
}
export declare class WMFConverter {
    logger: (message: string, level?: string) => void;
    constructor(logger: (message: string, level?: string) => void);
    private _readFileToBlob;
    private _toArrayBuffer;
    private _convert;
    convertWMF(inputFile: string): Promise<{
        svg: string;
        returnValue: number;
    }>;
    convertWMFToFile(inputFile: string, outFile: string): Promise<{
        svg: string;
        returnValue: number;
    }>;
    convertWMZ(inputFile: string): Promise<{
        svg: string;
        returnValue: number;
    }>;
    convertWMZToFile(inputFile: string, outFile: string): Promise<{
        svg: string;
        returnValue: number;
    }>;
}
