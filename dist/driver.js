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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = void 0;
const index_1 = require("./index");
class Driver {
    constructor(encryptionSchema, file, seal, ipfs, blockchain) {
        this.encryptionSchema = encryptionSchema;
        this.file = file;
        this.seal = seal;
        this.ipfs = ipfs;
        this.blockchain = blockchain;
        this.metadata = new index_1.Metadata(seal, ipfs);
    }
    upstream() {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let chunkCount = 0;
            const readStream = this.file.getReadStream();
            try {
                for (var readStream_1 = __asyncValues(readStream), readStream_1_1; readStream_1_1 = yield readStream_1.next(), !readStream_1_1.done;) {
                    const chunk = readStream_1_1.value;
                    yield this.upstreamChunkProcessingPipeLine(chunk, chunkCount++, this.ipfs);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (readStream_1_1 && !readStream_1_1.done && (_a = readStream_1.return)) yield _a.call(readStream_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // @ts-ignore
            let cidList = this.metadata.getCIDList();
            // now let's compress and process the sealedData
            let sealedData = yield this.metadata.generateSealedMetadata();
            const result = yield this.ipfs.add(sealedData);
            cidList.push({
                'cid': result.cid,
                'size': result.size
            });
            yield this.blockchain.init();
            const storage = this.blockchain.storage;
            const contract = this.blockchain.contract;
            const storageResult = yield storage.placeBatchOrderWithCIDList(cidList);
            if (storageResult) {
                //@ts-ignore
                // await storage.awaitNetworkFetching(cidList)
                const contractResult = yield contract.execContract('createVault', [
                    result.cid
                ]);
                return contractResult['ok'];
            }
        });
    }
    upstreamChunkProcessingPipeLine(chunk, chunkId, ipfs) {
        return __awaiter(this, void 0, void 0, function* () {
            // 0. get raw chunk size
            const rawChunkSize = chunk.length;
            // 1. get hash, if this is the first chunk, get the hash
            //          else, get hash combined with last hash
            if (this.metadata.hash === undefined) {
                this.metadata.hash = yield index_1.File.getChunkHash(chunk);
            }
            else {
                this.metadata.hash = yield index_1.File.getCombinedChunkHash(this.metadata.hash, chunk);
            }
            // 2. deflate the chunk
            chunk = yield index_1.File.deflatChunk(chunk);
            // 3. SecretBox encryption
            chunk = (new index_1.SecretBox(this.metadata.seal.sealingKey)).encrypt(chunk);
            // 4. upload to IPFS
            const IPFS_CID = yield ipfs.add(index_1.Util.u8aToHex(chunk));
            // 5. write to chunkMetadata
            this.metadata.writeChunkResult(chunkId, rawChunkSize, chunk.length, IPFS_CID.cid.toString());
        });
    }
    static getMetadataByVaultId(vaultId, blockchain, ipfs, keys) {
        return __awaiter(this, void 0, void 0, function* () {
            yield blockchain.init();
            const contract = blockchain.contract;
            const contractResult = (yield contract.queryContract('getMetadata', [vaultId])).output.toString();
            let metadata = yield ipfs.cat(contractResult);
            // revert the metadata compressing process 
            metadata = index_1.Metadata.recoverSealedData(metadata);
            let unsealed = index_1.Seal.recover(metadata.public, metadata.private, keys, metadata.author);
            unsealed = yield index_1.Metadata.recoverPreSealData(unsealed, ipfs);
            // console.log(unsealed)
            return unsealed;
        });
    }
    static downstream(vaultId, blockchain, ipfs, outputPath, keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const unsealed = yield this.getMetadataByVaultId(vaultId, blockchain, ipfs, keys);
            const sealingKey = unsealed.sealingKey;
            const chunks = unsealed.chunks;
            let hash = unsealed.hash;
            return yield this.downstreamChunkProcessingPipeLine(chunks, hash, sealingKey, ipfs, outputPath);
        });
    }
    static downstreamChunkProcessingPipeLine(chunks, hash, sealingKey, ipfs, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentHash;
            for (let chunkCID of chunks) {
                let chunk = yield ipfs.cat(index_1.Util.u8aToString(index_1.Util.hexToU8a(chunkCID)));
                chunk = index_1.Util.hexToU8a(chunk);
                chunk = index_1.SecretBox.decrypt(sealingKey, chunk);
                chunk = yield index_1.File.inflatDeflatedChunk(chunk);
                if (currentHash === undefined) {
                    currentHash = yield index_1.File.getChunkHash(chunk);
                }
                else {
                    currentHash = yield index_1.File.getCombinedChunkHash(currentHash, chunk);
                }
                yield Driver.fileReady(chunk, outputPath);
            }
            if (index_1.Util.u8aToHex(currentHash) !== index_1.Util.u8aToHex(hash)) {
                throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine');
            }
        });
    }
    static fileReady(chunk, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.File.writeFile(chunk, outputPath, 'a');
            return true;
        });
    }
    static updateEncryptionSchema(vaultId, newEncryptionSchema, seed, keys, ipfs, blockchain) {
        return __awaiter(this, void 0, void 0, function* () {
            const unsealed = yield Driver.getMetadataByVaultId(vaultId, blockchain, ipfs, keys);
            const newSeal = new index_1.Seal(newEncryptionSchema, seed, unsealed.sealingKey);
            const reSealed = index_1.Metadata.packageSealed(newSeal, index_1.Metadata.packagePreSeal(newSeal, unsealed.hash, index_1.Util.stringToU8a(unsealed.chunksCID)));
            yield blockchain.init();
            const storage = blockchain.storage;
            const contract = blockchain.contract;
            const result = yield ipfs.add(reSealed);
            const cidList = [{
                    'cid': result.cid.toString(),
                    'size': result.size
                }];
            // @ts-ignore
            const storageResult = yield storage.placeBatchOrderWithCIDList(cidList);
            if (storageResult) {
                // @ts-ignore
                // await storage.awaitNetworkFetching(cidList)
                const contractResult = contract.execContract('updateMetadata', [vaultId, result.cid.toString()]);
                return contractResult;
            }
            return null;
        });
    }
}
exports.Driver = Driver;
//# sourceMappingURL=driver.js.map