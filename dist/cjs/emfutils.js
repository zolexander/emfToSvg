"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedExtensions = exports.logMessage = exports.extractGzip = exports.toArrayBuffer = exports.readFileToBlob = exports.WriteStream = void 0;
const fs_1 = __importDefault(require("fs"));
const zlib_1 = require("zlib");
const stream_1 = require("stream");
const path_1 = __importDefault(require("path"));
let firstRun = true;
class WriteStream extends stream_1.Writable {
    constructor() {
        super();
        this.stream = Buffer.alloc(0);
    }
    _write(chunk, enc, next) {
        this.stream = Buffer.concat([this.stream, chunk]);
        next();
    }
    getResult() {
        return this.stream;
    }
}
exports.WriteStream = WriteStream;
async function readFileToBlob(filePath) {
    const fileBuffer = await fs_1.default.promises.readFile(filePath);
    let arrayBuffer = toArrayBuffer(fileBuffer);
    return arrayBuffer;
}
exports.readFileToBlob = readFileToBlob;
function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}
exports.toArrayBuffer = toArrayBuffer;
async function extractGzip(str) {
    return new Promise((resolve, reject) => {
        const gzipStream = fs_1.default.createReadStream(str);
        const gunzip = (0, zlib_1.createGunzip)();
        const chunks = [];
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
exports.extractGzip = extractGzip;
function logMessage(message, level) {
    var logPath = path_1.default.join(__dirname, 'logs', 'app.log');
    if (firstRun) {
        let directoryPath = path_1.default.join(__dirname, 'logs');
        if (!fs_1.default.existsSync(directoryPath)) {
            fs_1.default.mkdirSync(directoryPath);
        }
        if (!fs_1.default.existsSync(logPath)) {
            fs_1.default.writeFileSync(logPath, message);
        }
        else {
            fs_1.default.appendFileSync(logPath, message);
        }
        firstRun = false;
    }
    console.log(message);
    fs_1.default.appendFileSync(logPath, message);
}
exports.logMessage = logMessage;
function allowedExtensions(imagetypes, str) {
    let result = false;
    imagetypes.forEach(value => {
        if (str.includes(value)) {
            result = true;
        }
    });
    return result;
}
exports.allowedExtensions = allowedExtensions;
