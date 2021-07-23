"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = void 0;
const index_1 = require("./index");
class Driver {
    static async upstream(config) {
        const ipfs = new index_1.IPFS();
        const { file, seal, blockchain } = config;
        const metadata = new index_1.Metadata({ seal: seal });
        let chunkCount = 0;
        const readStream = file.getReadStream();
        for await (const chunk of readStream) {
            await Driver.upstreamChunkProcessingPipeLine(metadata, chunk, chunkCount++);
        }
        // @ts-ignore
        let cidList = metadata.getCIDList();
        let sealedData = await metadata.generateSealedMetadata();
        const result = await ipfs.add(sealedData);
        cidList.push({
            'cid': result.cid,
            'size': result.size
        });
        await blockchain.init();
        const storage = blockchain.storage;
        const contract = blockchain.contract;
        const storageResult = await storage.placeBatchOrderWithCIDList(cidList);
        if (storageResult) {
            //@ts-ignore
            // await storage.awaitNetworkFetching(cidList)
            const contractResult = await contract.execContract('createVault', [
                result.cid
            ]);
            return contractResult['ok'];
        }
    }
    static async upstreamChunkProcessingPipeLine(metadata, chunk, chunkId) {
        // 0. get raw chunk size
        const rawChunkSize = chunk.length;
        // 1. get hash, if this is the first chunk, get the hash
        //          else, get hash combined with last hash
        if (metadata.hash === undefined) {
            metadata.hash = await index_1.File.getChunkHash(chunk);
        }
        else {
            metadata.hash = await index_1.File.getCombinedChunkHash(metadata.hash, chunk);
        }
        // 2. deflate the chunk
        chunk = await index_1.File.deflatChunk(chunk);
        // 3. SecretBox encryption
        chunk = index_1.SymmetricEncryption.encrypt(metadata.seal.sealingKey, chunk);
        // 4. upload to IPFS
        const ipfs = new index_1.IPFS();
        const IPFS_CID = await ipfs.add(index_1.Util.u8aToHex(chunk));
        // 5. write to chunkMetadata
        metadata.writeChunkResult({
            chunkId: chunkId,
            rawChunkSize: rawChunkSize,
            ipfsChunkSize: IPFS_CID.size,
            ipfsCID: IPFS_CID.cid.toString()
        });
    }
    static async getMetadataByVaultId(vaultId, blockchain, keys) {
        await blockchain.init();
        const contract = blockchain.contract;
        const contractResult = (await contract
            .queryContract('getMetadata', [vaultId])).output.toString();
        const ipfs = new index_1.IPFS();
        let metadata = await ipfs.cat(contractResult);
        // revert the metadata compressing process 
        metadata = index_1.Metadata.recoverSealedData(metadata);
        let unsealed = index_1.Seal.recover({
            public_pieces: metadata.public,
            private_pieces: metadata.private,
            keys: keys,
            orignalAuthor: metadata.author
        });
        unsealed = await index_1.Metadata.recoverPreSealData(unsealed);
        return unsealed;
    }
    static async downstream(config) {
        const { vaultId, blockchain, keys, writeStream } = config;
        const unsealed = await this.getMetadataByVaultId(vaultId, blockchain, keys);
        const sealingKey = unsealed.sealingKey;
        const chunks = unsealed.chunks;
        let hash = unsealed.hash;
        return await this.downstreamChunkProcessingPipeLine(chunks, hash, sealingKey, writeStream);
    }
    static async downstreamChunkProcessingPipeLine(chunks, hash, sealingKey, writeStream) {
        const ipfs = new index_1.IPFS();
        let currentHash;
        for (let chunkCID of chunks) {
            let chunk = await ipfs.cat(chunkCID);
            chunk = index_1.Util.hexToU8a(chunk);
            chunk = index_1.SymmetricEncryption.decrypt(sealingKey, chunk);
            chunk = await index_1.File.inflatDeflatedChunk(chunk);
            if (currentHash === undefined) {
                currentHash = await index_1.File.getChunkHash(chunk);
            }
            else {
                currentHash = await index_1.File.getCombinedChunkHash(currentHash, chunk);
            }
            writeStream.write(chunk);
        }
        if (index_1.Util.u8aToHex(currentHash) !== index_1.Util.u8aToHex(hash)) {
            throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine');
        }
    }
    static async updateEncryptionSchema(config) {
        const { vaultId, newEncryptionSchema, seed, keys, blockchain } = config;
        const unsealed = await Driver.getMetadataByVaultId(vaultId, blockchain, keys);
        const newSeal = new index_1.Seal({
            encryptionSchema: newEncryptionSchema,
            seed: seed,
            sealingKey: unsealed.sealingKey
        });
        const reSealed = index_1.Metadata.packageSealed(newSeal, index_1.Metadata.packagePreSeal(newSeal, unsealed.hash, index_1.Util.stringToU8a(unsealed.chunksCID)));
        await blockchain.init();
        const storage = blockchain.storage;
        const contract = blockchain.contract;
        const ipfs = new index_1.IPFS();
        const result = await ipfs.add(reSealed);
        const cidList = [{
                'cid': result.cid.toString(),
                'size': result.size
            }];
        // @ts-ignore
        const storageResult = await storage.placeBatchOrderWithCIDList(cidList);
        if (storageResult) {
            // @ts-ignore
            // await storage.awaitNetworkFetching(cidList)
            const contractResult = contract.execContract('updateMetadata', [vaultId, result.cid.toString()]);
            return contractResult;
        }
        return null;
    }
}
exports.Driver = Driver;
//# sourceMappingURL=driver.js.map