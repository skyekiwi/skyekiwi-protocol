import { File, Util} from '../index'

export class Chunks {

  public file: File
  public chunkList: {
    [chunkId: number]: {
      "rawChunkSize": number,
      "ipfsChunkSize": number,
      "ipfsCID": string
    }
  }
  public hash: Uint8Array

  constructor(file: File) {
    this.file = file
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

  public serialize() : string {
    return Util.serialize({
      file: this.file.serialize(),
      chunkStats: this.chunkList,
      hash: this.hash
    });
  }

  public static parse(str: string) {
    const object = Util.parse(str)

    let chunks = new Chunks(File.parse(object.file))
    chunks.chunkList = object.chunkList
    chunks.hash = object.hash

    return chunks
  }


}
