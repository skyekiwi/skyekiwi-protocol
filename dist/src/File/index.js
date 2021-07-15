"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    constructor(fileName, readStream) {
        this.fileName = fileName;
        this.readStream = readStream;
    }
    getReadStream() {
        return this.readStream;
    }
    static getChunkHash(chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof fs_1.default === undefined) {
                return new Uint8Array(yield window.crypto.subtle.digest('SHA-256', chunk));
            }
            let hashSum = crypto_1.default.createHash('sha256');
            hashSum.update(chunk);
            return hashSum.digest();
        });
    }
    static getCombinedChunkHash(previousHash, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            if (previousHash.length !== 32) {
                console.log(previousHash);
                throw new Error("previousHash not valid - File.getCombinedChunkHash");
            }
            // size: 32bytes for previousHash + chunk size 
            const combined = new Uint8Array(32 + chunk.length);
            combined.set(previousHash, 0);
            combined.set(chunk, 32);
            return yield File.getChunkHash(combined);
        });
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
        if (typeof fs_1.default === undefined) {
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
        else {
            throw new Error("save as is for browsers, use File.writeFiles instead - File.saveAs");
        }
    }
}
exports.File = File;
//# sourceMappingURL=index.js.map