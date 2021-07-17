"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const pako_1 = __importDefault(require("pako"));
const fs_1 = __importDefault(require("fs"));
const file_saver_1 = __importDefault(require("file-saver"));
const crypto_1 = __importDefault(require("crypto"));
class File {
    constructor(config) {
        this.fileName = config.fileName;
        this.readStream = config.readStream;
    }
    getReadStream() {
        return this.readStream;
    }
    static async getChunkHash(chunk) {
        if (typeof fs_1.default === undefined) {
            return new Uint8Array(await window.crypto.subtle.digest('SHA-256', chunk));
        }
        let hashSum = crypto_1.default.createHash('sha256');
        hashSum.update(chunk);
        return hashSum.digest();
    }
    static async getCombinedChunkHash(previousHash, chunk) {
        if (previousHash.length !== 32) {
            console.log(previousHash);
            throw new Error("previousHash not valid - File.getCombinedChunkHash");
        }
        // size: 32bytes for previousHash + chunk size 
        const combined = new Uint8Array(32 + chunk.length);
        combined.set(previousHash, 0);
        combined.set(chunk, 32);
        return await File.getChunkHash(combined);
    }
    static deflatChunk(chunk) {
        return pako_1.default.deflate(chunk);
    }
    static inflatDeflatedChunk(deflatedChunk) {
        try {
            return pako_1.default.inflate(deflatedChunk);
        }
        catch (err) {
            throw new Error("inflation failed - File.inflatDeflatedChunk");
        }
    }
    static writeFile(content, filePath, flags) {
        return new Promise((res, rej) => {
            const stream = fs_1.default.createWriteStream(filePath, { flags: flags });
            stream.write(content);
            stream.end();
            stream.on('finish', () => res(true));
            stream.on('error', rej);
        });
    }
    static saveAs(content, fileName, fileType) {
        return new Promise((res, rej) => {
            try {
                file_saver_1.default.saveAs(new Blob([content], { type: fileType }), fileName);
                res(true);
            }
            catch (err) {
                rej();
            }
        });
    }
}
exports.File = File;
//# sourceMappingURL=index.js.map