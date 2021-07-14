"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chunks = void 0;
const index_1 = require("../index");
class Chunks {
    constructor() {
        this.chunkList = {};
    }
    writeChunkResult(chunkId, rawChunkSize, ipfsChunkSize, ipfsCID) {
        if (ipfsCID.length !== 46) {
            throw new Error('IPFS CID Length Err - ChunkMetadata.writeChunkResult');
        }
        if (this.chunkList[chunkId] !== undefined) {
            throw new Error('chunk order err - ChunkMetadata.writeChunkResult');
        }
        this.chunkList[chunkId] = {
            "rawChunkSize": rawChunkSize,
            "ipfsChunkSize": ipfsChunkSize,
            "ipfsCID": ipfsCID
        };
    }
    getCIDList() {
        let cids = [];
        for (let chunksId in this.chunkList) {
            cids.push({
                'cid': this.chunkList[chunksId].ipfsCID,
                'size': this.chunkList[chunksId].ipfsChunkSize
            });
        }
        return cids;
    }
    serialize() {
        return index_1.Util.serialize({
            chunkList: this.chunkList,
            hash: this.hash
        });
    }
    static parse(str) {
        const object = index_1.Util.parse(str);
        let chunks = new Chunks();
        chunks.chunkList = object.chunkList;
        chunks.hash = object.hash;
        return chunks;
    }
}
exports.Chunks = Chunks;
//# sourceMappingURL=Chunks.js.map