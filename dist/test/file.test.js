"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SkyeKiwi = __importStar(require("../src/index"));
const chai_1 = require("chai");
const tweetnacl_1 = require("tweetnacl");
const fs_1 = __importDefault(require("fs"));
const file1Path = '/tmp/file.file1';
const setup = async () => {
    // we are creating two files here:
    // tmp.file1 - a 1.2MB file with random bytes
    try {
        cleanup();
    }
    catch (err) {
        // pass
    }
    const content1 = tweetnacl_1.randomBytes(1200000);
    await SkyeKiwi.File.writeFile(content1, file1Path, 'a');
    // SkyeKiwi.File has a default chunk size of 100MB.
    // we are making it 0.1MB here to demostrate it works
    const file1 = new SkyeKiwi.File({
        fileName: 'tmp.file1',
        readStream: fs_1.default.createReadStream(file1Path, {
            highWaterMark: 1 * (10 ** 5)
        })
    });
    return { file1 };
};
const cleanup = async () => {
    const unlink = (filePath) => {
        return new Promise((res, rej) => {
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    rej(err);
                res(true);
            });
        });
    };
    await unlink(file1Path);
};
describe('File', function () {
    this.timeout(15000);
    it('File: chunk hash calculation works', async () => {
        let { file1 } = await setup();
        const stream1 = file1.getReadStream();
        let hash1;
        for await (const chunk of stream1) {
            if (hash1 === undefined) {
                hash1 = await SkyeKiwi.File.getChunkHash(chunk);
            }
            else {
                hash1 = await SkyeKiwi.File.getCombinedChunkHash(hash1, chunk);
            }
        }
        await cleanup();
    });
    it('File: inflate & deflat work', async () => {
        let { file1 } = await setup();
        const stream1 = file1.getReadStream();
        for await (const chunk of stream1) {
            const deflatedChunk = await SkyeKiwi.File.deflatChunk(chunk);
            const inflatedChunk = await SkyeKiwi.File.inflatDeflatedChunk(deflatedChunk);
            chai_1.expect(inflatedChunk).to.deep.equal(chunk);
        }
        await cleanup();
    });
});
//# sourceMappingURL=file.test.js.map