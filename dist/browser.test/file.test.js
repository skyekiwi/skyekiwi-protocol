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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SkyeKiwi = __importStar(require("../src/index"));
const chai_1 = require("chai");
const tweetnacl_1 = require("tweetnacl");
const fs_1 = __importDefault(require("fs"));
const file1Path = './file.file1';
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    // we are creating two files here:
    // tmp.file1 - a 1.2MB file with random bytes
    // try {
    //   cleanup()
    // } catch (err) {
    //   // pass
    // }
    const content1 = tweetnacl_1.randomBytes(1200000);
    yield SkyeKiwi.File.writeFile(content1, file1Path, 'a');
    // SkyeKiwi.File has a default chunk size of 100MB.
    // we are making it 0.1MB here to demostrate it works
    const file1 = new SkyeKiwi.File('tmp.file1', fs_1.default.createReadStream(file1Path, {
        highWaterMark: 1 * (Math.pow(10, 5))
    }));
    return { file1 };
});
// const cleanup = async () => {
//   const unlink = (filePath) => {
//     return new Promise((res, rej) => {
//       fs.unlink(filePath, (err) => {
//         if (err) rej(err)
//         res(true)
//       });
//     });
//   }
//   await unlink(file1Path)
// }
describe('File', function () {
    this.timeout(15000);
    it('File: chunk hash calculation works', () => __awaiter(this, void 0, void 0, function* () {
        var e_1, _a;
        let { file1 } = yield setup();
        const stream1 = file1.getReadStream();
        let hash1;
        try {
            for (var stream1_1 = __asyncValues(stream1), stream1_1_1; stream1_1_1 = yield stream1_1.next(), !stream1_1_1.done;) {
                const chunk = stream1_1_1.value;
                if (hash1 === undefined) {
                    hash1 = yield SkyeKiwi.File.getChunkHash(chunk);
                }
                else {
                    hash1 = yield SkyeKiwi.File.getCombinedChunkHash(hash1, chunk);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (stream1_1_1 && !stream1_1_1.done && (_a = stream1_1.return)) yield _a.call(stream1_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // await cleanup()
    }));
    it('File: inflate & deflat work', () => __awaiter(this, void 0, void 0, function* () {
        var e_2, _b;
        let { file1 } = yield setup();
        const stream1 = file1.getReadStream();
        try {
            for (var stream1_2 = __asyncValues(stream1), stream1_2_1; stream1_2_1 = yield stream1_2.next(), !stream1_2_1.done;) {
                const chunk = stream1_2_1.value;
                const deflatedChunk = yield SkyeKiwi.File.deflatChunk(chunk);
                const inflatedChunk = yield SkyeKiwi.File.inflatDeflatedChunk(deflatedChunk);
                chai_1.expect(inflatedChunk).to.deep.equal(chunk);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (stream1_2_1 && !stream1_2_1.done && (_b = stream1_2.return)) yield _b.call(stream1_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // await cleanup()
    }));
});
//# sourceMappingURL=file.test.js.map