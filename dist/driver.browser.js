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
const util_1 = require("@polkadot/util");
const index_1 = require("./index");
class Driver {
    constructor(encryptionSchema, file, seal, ipfs, blockchain) {
        this.encryptionSchema = encryptionSchema;
        this.file = file;
        this.seal = seal;
        this.ipfs = ipfs;
        this.blockchain = blockchain;
        this.metadata = new index_1.Metadata(new index_1.Chunks(), seal);
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
            let cidList = this.metadata.chunks.getCIDList();
            // now let's compress and process the sealedData
            let sealedData = this.metadata.generateSealedMetadata();
            sealedData = index_1.Util.serialize(sealedData);
            sealedData = util_1.stringToU8a(sealedData);
            sealedData = yield index_1.File.deflatChunk(sealedData);
            sealedData = index_1.Util.u8aToHex(sealedData);
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
            if (this.metadata.chunks.hash === undefined) {
                this.metadata.chunks.hash = yield index_1.File.getChunkHash(chunk);
            }
            else {
                this.metadata.chunks.hash = yield index_1.File.getCombinedChunkHash(this.metadata.chunks.hash, chunk);
            }
            // 2. deflate the chunk
            chunk = yield index_1.File.deflatChunk(chunk);
            // 3. SecretBox encryption
            chunk = (new index_1.SecretBox(this.metadata.seal.sealingKey)).encrypt(chunk);
            // 4. upload to IPFS
            const IPFS_CID = yield ipfs.add(index_1.Util.u8aToHex(chunk));
            // 5. write to chunkMetadata
            this.metadata.chunks.writeChunkResult(chunkId, rawChunkSize, chunk.length, IPFS_CID.cid.toString());
        });
    }
    static getMetadataByVaultId(vaultId, blockchain, ipfs, keys) {
        return __awaiter(this, void 0, void 0, function* () {
            yield blockchain.init();
            const contract = blockchain.contract;
            const contractResult = (yield contract.queryContract('getMetadata', [vaultId])).output.toString();
            let metadata = yield ipfs.cat(contractResult);
            // revert the metadata compressing process 
            metadata = index_1.Util.hexToU8a(metadata);
            metadata = yield index_1.File.inflatDeflatedChunk(metadata);
            metadata = util_1.u8aToString(metadata);
            metadata = index_1.Util.parse(metadata);
            let unsealed = index_1.Seal.recover(metadata.public, metadata.private, keys, metadata.author);
            unsealed = util_1.u8aToString(unsealed);
            unsealed = index_1.Util.parse(unsealed);
            return unsealed;
        });
    }
    static downstream(vaultId, blockchain, ipfs, keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const unsealed = yield this.getMetadataByVaultId(vaultId, blockchain, ipfs, keys);
            const sealingKey = unsealed.sealingKey;
            const chunks = unsealed.chunkMetadata.chunkList;
            const hash = unsealed.chunkMetadata.hash;
            return yield this.downstreamChunkProcessingPipeLine(chunks, hash, sealingKey, ipfs);
        });
    }
    static downstreamChunkProcessingPipeLine(chunks, hash, sealingKey, ipfs //,
    // outputPath: string
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentHash;
            for (let chunkId in chunks) {
                let cid = chunks[chunkId].ipfsCID;
                let rawChunkSize = chunks[chunkId].rawChunkSize;
                let chunk = yield ipfs.cat(cid);
                chunk = index_1.Util.hexToU8a(chunk);
                chunk = index_1.SecretBox.decrypt(sealingKey, chunk);
                chunk = yield index_1.File.inflatDeflatedChunk(chunk);
                if (currentHash === undefined) {
                    currentHash = yield index_1.File.getChunkHash(chunk);
                }
                else {
                    currentHash = yield index_1.File.getCombinedChunkHash(currentHash, chunk);
                }
                if (chunk.length != rawChunkSize) {
                    throw new Error('chunk size error: Driver.downstreamChunkProcessingPipeLine');
                }
                yield index_1.File.saveAs(chunk);
            }
            if (currentHash.length != hash.length) {
                throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine');
            }
            for (let i = 0; i < currentHash.length; i++) {
                if (currentHash[i] != hash[i]) {
                    throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine');
                }
            }
        });
    }
    static updateEncryptionSchema(vaultId, newEncryptionSchema, seed, keys, ipfs, blockchain) {
        return __awaiter(this, void 0, void 0, function* () {
            const unsealed = yield Driver.getMetadataByVaultId(vaultId, blockchain, ipfs, keys);
            const chunks = index_1.Chunks.parse(index_1.Util.serialize(unsealed.chunkMetadata));
            // TODO: check if sealingKey existis
            const metadata = new index_1.Metadata(chunks, new index_1.Seal(newEncryptionSchema, seed, unsealed.sealingKey));
            let sealedData = metadata.generateSealedMetadata();
            sealedData = index_1.Util.serialize(sealedData);
            sealedData = util_1.stringToU8a(sealedData);
            sealedData = yield index_1.File.deflatChunk(sealedData);
            sealedData = index_1.Util.u8aToHex(sealedData);
            yield blockchain.init();
            const storage = blockchain.storage;
            const contract = blockchain.contract;
            const result = yield ipfs.add(sealedData);
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
//# sourceMappingURL=driver.browser.js.map