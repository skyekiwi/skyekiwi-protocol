import {RawFile} from './index'

export class Chunks {

  public rawFile: RawFile
  public chunkList: {
    [chunkId: number]: {
      "rawChunkSize": number,
      "ipfsChunkSize": number,
      "ipfsCID": string
    }
  }
  public hash: Uint8Array

  constructor(rawFile: RawFile) {
    this.rawFile = rawFile
    this.chunkList = {}
  }

  public writeChunkResult(
    chunkId: number , rawChunkSize: number, ipfsChunkSize: number, ipfsCID: string
  ) {
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
    }
  }

  public getCIDList() {
    let cids = [];

    for (let chunksId in this.chunkList) {
      cids.push({
        'cid': this.chunkList[chunksId].ipfsCID,
        'size': this.chunkList[chunksId].ipfsChunkSize
      });
    }

    return cids;
  }

  public toString() : string {
    return JSON.stringify({
      rawFile: this.rawFile.toString(),
      chunkStats: JSON.stringify(this.chunkList),
      hash: Buffer.from(this.hash).toString('hex')
    });
  }

}
