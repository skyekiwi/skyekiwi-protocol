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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metadata = exports.SKYEKIWI_VERSION = exports.EncryptionSchema = exports.Seal = void 0;
const EncryptionSchema_1 = require("./EncryptionSchema");
Object.defineProperty(exports, "EncryptionSchema", { enumerable: true, get: function () { return EncryptionSchema_1.EncryptionSchema; } });
const Seal_1 = require("./Seal");
Object.defineProperty(exports, "Seal", { enumerable: true, get: function () { return Seal_1.Seal; } });
const index_1 = require("../index");
// version code in Uint8Array
exports.SKYEKIWI_VERSION = new Uint8Array([0, 0, 0, 1]);
class Metadata {
    constructor(seal, ipfs) {
        this.seal = seal;
        this.ipfs = ipfs;
        this.chunkList = {};
    }
    getCIDList() {
        let cids = [];
        for (let chunksId in this.chunkList) {
            cids.push({
                'cid': this.chunkList[chunksId].ipfsCID,
                'size': this.chunkList[chunksId].ipfsChunkSize
            });
        }
        if (this.chunkListCID) {
            cids.push(this.chunkListCID);
        }
        return cids;
    }
    writeChunkResult(chunkId, rawChunkSize, ipfsChunkSize, ipfsCID) {
        if (ipfsCID.length !== 46) {
            throw new Error('IPFS CID Length Err - ChunkMetadata.writeChunkResult');
        }
        if (this.chunkList[chunkId] !== undefined) {
            throw new Error('chunk order err - Metadata.writeChunkResult');
        }
        this.chunkList[chunkId] = {
            "rawChunkSize": rawChunkSize,
            "ipfsChunkSize": ipfsChunkSize,
            "ipfsCID": ipfsCID
        };
    }
    generatePreSealingMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            let chunk = "";
            for (let chunksId in this.chunkList) {
                // 46 char
                chunk += this.chunkList[chunksId].ipfsCID;
                // 1 char divider
                chunk += '-';
            }
            chunk = index_1.Util.trimEnding(chunk);
            const chunkU8a = index_1.Util.stringToU8a(chunk);
            const chunkHex = index_1.Util.u8aToHex(chunkU8a);
            const cid = yield this.ipfs.add(chunkHex);
            this.chunkListCID = {
                'cid': cid.cid.toString(),
                'size': cid.size
            };
            const chunkCIDU8a = index_1.Util.stringToU8a(this.chunkListCID.cid);
            return Metadata.packagePreSeal(this.seal, this.hash, chunkCIDU8a);
        });
    }
    generateSealedMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            const preSealData = yield this.generatePreSealingMetadata();
            return Metadata.packageSealed(this.seal, preSealData);
        });
    }
    static recoverPreSealData(preSealData, ipfs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (preSealData.length != 146) {
                throw new Error("wrong length of pre-sealed data - Metadata.recover");
            }
            const slk = preSealData.slice(0, 32);
            const hash = preSealData.slice(32, 64);
            const author = preSealData.slice(64, 96);
            const version = preSealData.slice(96, 100);
            const chunksCID = index_1.Util.u8aToString(preSealData.slice(100));
            const chunks = (yield ipfs.cat(chunksCID)).split(' ');
            return {
                sealingKey: slk,
                hash: hash,
                author: author,
                version: version,
                chunks: chunks,
                chunksCID: chunksCID
            };
        });
    }
    static recoverSealedData(hex) {
        const pieces = hex.split('-');
        return {
            publicSealingKey: index_1.Util.hexToU8a(pieces[0]),
            author: index_1.Util.hexToU8a(pieces[1]),
            public: pieces[2].split('|').map(index_1.Util.hexToU8a),
            private: pieces[3].split('|').map(index_1.Util.hexToU8a),
            version: index_1.Util.hexToU8a(pieces[4])
        };
    }
    static packagePreSeal(seal, hash, chunksCID) {
        const result = new Uint8Array(
        // sealingKey, hash, Author
        32 * 3 +
            // skyekiwi version 
            4 +
            // an IPFS CID in binary
            46);
        if (!(seal.sealingKey.length == 32) ||
            !(hash.length == 32) ||
            !(seal.getPublicAuthorKey().length == 32) ||
            !(exports.SKYEKIWI_VERSION.length == 4) ||
            !(chunksCID.length == 46)) {
            throw new Error("pre-sealing error - Metadata.getPreSealData");
        }
        result.set(seal.sealingKey, 0);
        result.set(hash, 32);
        result.set(seal.getPublicAuthorKey(), 64);
        result.set(exports.SKYEKIWI_VERSION, 96);
        result.set(chunksCID, 100);
        return result;
    }
    static packageSealed(seal, preSealData) {
        if (preSealData.length != 146) {
            throw new Error("pre-seal data len error - Metadata.generateSealedMetadata");
        }
        const sealed = seal.seal(preSealData);
        return index_1.Util.u8aToHex(seal.getPublicSealingKey()) + '-' +
            index_1.Util.u8aToHex(seal.encryptionSchema.author) + '-' +
            sealed.public + '-' +
            sealed.private + '-' +
            index_1.Util.u8aToHex(exports.SKYEKIWI_VERSION);
    }
}
exports.Metadata = Metadata;
//# sourceMappingURL=index.js.map