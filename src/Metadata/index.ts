import { EncryptionSchema } from './EncryptionSchema'
import { Seal } from './Seal'
import {IPFS, Util, SecretBox} from '../index'

export {
  Seal, EncryptionSchema
}

// version code in Uint8Array
export const SKYEKIWI_VERSION = new Uint8Array([0,0,0,1]);

export class Metadata {

  public hash: Uint8Array
  public chunkList: {
    [chunkId: number]: {
      "rawChunkSize": number,
      "ipfsChunkSize": number,
      "ipfsCID": string
    }
  }
  public chunkListCID: {
    'cid': string,
    'size': number
  }

  constructor (
    public seal: Seal,
    public ipfs: IPFS
  ) {
    this.chunkList = {}
  }

  public getCIDList() {
    let cids = [];

    for (let chunksId in this.chunkList) {
      cids.push({
        'cid': this.chunkList[chunksId].ipfsCID,
        'size': this.chunkList[chunksId].ipfsChunkSize
      });
    }
    if (this.chunkListCID) {
      cids.push(this.chunkListCID)
    }

    return cids;
  }

  public writeChunkResult(
    chunkId: number, rawChunkSize: number, ipfsChunkSize: number, ipfsCID: string
  ) {
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
    }
  }

  public async generatePreSealingMetadata() {

    let chunk = ""
    for (let chunksId in this.chunkList) {
      // 46 char
      chunk += this.chunkList[chunksId].ipfsCID

      // 1 char divider
      chunk += '-'
    }
    chunk = Util.trimEnding(chunk)
    const chunkU8a = Util.stringToU8a(chunk)

    const encryptedChunk = (new SecretBox(this.seal.sealingKey)).encrypt(chunkU8a)
    const chunkHex = Util.u8aToHex(encryptedChunk)
    
    const cid = await this.ipfs.add(chunkHex)

    this.chunkListCID = {
      'cid': cid.cid.toString(),
      'size': cid.size
    }
    const chunkCIDU8a = Util.stringToU8a(this.chunkListCID.cid)
    
    return Metadata.packagePreSeal(
      this.seal, this.hash, chunkCIDU8a
    );
  }

  public async generateSealedMetadata() {

    const preSealData = await this.generatePreSealingMetadata()
    return Metadata.packageSealed(this.seal, preSealData)
  }

  public static async recoverPreSealData(preSealData: Uint8Array, ipfs: IPFS) {
    if (preSealData.length != 146) {
      throw new Error("wrong length of pre-sealed data - Metadata.recover")
    }

    const slk = preSealData.slice(0, 32)
    const hash = preSealData.slice(32, 64)
    const author = preSealData.slice(64, 96)
    const version = preSealData.slice(96, 100)
    const chunksCID = Util.u8aToString(preSealData.slice(100))

    const encryptedChunks = Util.hexToU8a(await ipfs.cat(chunksCID))

    const _chunks = SecretBox.decrypt(slk, encryptedChunks)
    const chunks = Util.u8aToString(_chunks).split(' ')

    return {
      sealingKey: slk,
      hash: hash,
      author: author,
      version: version,
      chunks: chunks,
      chunksCID: chunksCID
    }
  }

  public static recoverSealedData(hex: string) {
    const pieces = hex.split('-')

    return {
      publicSealingKey: Util.hexToU8a(pieces[0]),
      author: Util.hexToU8a(pieces[1]),
      public: pieces[2].split('|').map(Util.hexToU8a),
      private: pieces[3].split('|').map(Util.hexToU8a),
      version: Util.hexToU8a(pieces[4])
    }
  }

  public static packagePreSeal(
    seal: Seal, hash: Uint8Array, chunksCID: Uint8Array
  ) {

    const result = new Uint8Array(
      // sealingKey, hash, Author
      32 * 3 +
      // skyekiwi version 
      4 +
      // an IPFS CID in binary
      46
    )

    if (
      !(seal.sealingKey.length == 32) ||
      !(hash.length == 32) ||
      !(seal.getPublicAuthorKey().length == 32) ||
      !(SKYEKIWI_VERSION.length == 4) ||
      !(chunksCID.length == 46)
    ) {
      throw new Error("pre-sealing error - Metadata.getPreSealData")
    }

    result.set(seal.sealingKey, 0)
    result.set(hash, 32)
    result.set(seal.getPublicAuthorKey(), 64)
    result.set(SKYEKIWI_VERSION, 96)
    result.set(chunksCID, 100)

    return result;
  }

  public static packageSealed(
    seal: Seal, preSealData: Uint8Array
  ): string {
    if (preSealData.length != 146) {
      throw new Error("pre-seal data len error - Metadata.generateSealedMetadata")
    }

    const sealed = seal.seal(preSealData)

    return Util.u8aToHex(seal.getPublicSealingKey()) + '-' +
      Util.u8aToHex(seal.encryptionSchema.author) + '-' +
      sealed.public + '-' +
      sealed.private + '-' +
      Util.u8aToHex(SKYEKIWI_VERSION)
  }
}
