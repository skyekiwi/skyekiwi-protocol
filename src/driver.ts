import { stringToU8a, u8aToString } from '@polkadot/util';
import {
  // EncryptionSchema, 
  Metadata, Seal, EncryptionSchema, Chunks,
  File, Util, Blockchain,

  IPFS,
  SecretBox
} from './index'

class Driver {

  private metadata: Metadata

  constructor(
    public encryptionSchema: EncryptionSchema,
    public file: File,
    public seal: Seal,
    public ipfs: IPFS,
    public blockchain: Blockchain
  ) {
    this.metadata = new Metadata(
      new Chunks(), seal
    )
  }

  public async upstream() {
    
    let chunkCount = 0;
    const readStream = this.file.getReadStream()

    for await (const chunk of readStream) {
      await this.upstreamChunkProcessingPipeLine(chunk, chunkCount++, this.ipfs);
      // console.log("finished", chunkCount)
    }

    // @ts-ignore
    let cidList:[{cid: string, size: number}] = this.metadata.chunks.getCIDList()

    // now let's compress and process the sealedData
    let sealedData : any = this.metadata.generateSealedMetadata()

    sealedData = Util.serialize(sealedData)
    sealedData = stringToU8a(sealedData)
    sealedData = await File.deflatChunk(sealedData)
    sealedData = Util.u8aToHex(sealedData)

    const result = await this.ipfs.add(sealedData)
    cidList.push({
      'cid': result.cid,
      'size': result.size
    })
    
    await this.blockchain.init()
    const storage = this.blockchain.storage
    const contract = this.blockchain.contract

    const storageResult = await storage.placeBatchOrderWithCIDList(cidList)

    if (storageResult) {
      //@ts-ignore
      // await storage.awaitNetworkFetching(cidList)
      const contractResult = await contract.execContract('createVault', [
        result.cid
      ])
      return contractResult['ok']
    }
  }

  private async upstreamChunkProcessingPipeLine(
    chunk: Uint8Array, chunkId: number, ipfs: IPFS
  ) {
    // 0. get raw chunk size
    const rawChunkSize = chunk.length;

    // 1. get hash, if this is the first chunk, get the hash
    //          else, get hash combined with last hash
    if (this.metadata.chunks.hash === undefined) {
      this.metadata.chunks.hash = await File.getChunkHash(chunk);
    } else {
      this.metadata.chunks.hash = await File.getCombinedChunkHash(
        this.metadata.chunks.hash, chunk
      );
    }

    // 2. deflate the chunk
    chunk = await File.deflatChunk(chunk);

    // 3. SecretBox encryption
    chunk = (new SecretBox(this.metadata.seal.sealingKey)).encrypt(chunk)

    // 4. upload to IPFS
    const IPFS_CID = await ipfs.add(Util.u8aToHex(chunk))

    // 5. write to chunkMetadata
    this.metadata.chunks.writeChunkResult(
      chunkId, rawChunkSize, chunk.length, IPFS_CID.cid.toString()
    );
  }

  public static async getMetadataByVaultId(
    vaultId: number, 
    blockchain: Blockchain, 
    ipfs: IPFS,
    keys: Uint8Array[]
  ) {
    await blockchain.init()
    const contract = blockchain.contract

    const contractResult = (await contract.queryContract('getMetadata', [vaultId])).output.toString()

    let metadata: any = await ipfs.cat(contractResult)

    // revert the metadata compressing process 
    metadata = Util.hexToU8a(metadata)
    metadata = await File.inflatDeflatedChunk(metadata)
    metadata = u8aToString(metadata)
    metadata = Util.parse(metadata)

    let unsealed: any = Seal.recover(
      metadata.public, metadata.private, keys, metadata.author
    )
    unsealed = u8aToString(unsealed)
    unsealed = Util.parse(unsealed)

    return unsealed
  }

  public static async downstream(
    vaultId: number,
    blockchain: Blockchain, 
    ipfs: IPFS, 
    outputPath: string,
    keys: Uint8Array[]
  ) {
    const unsealed = await this.getMetadataByVaultId(vaultId, blockchain, ipfs, keys)

    const sealingKey = unsealed.sealingKey
    const chunks = unsealed.chunkMetadata.chunkList
    let hash = unsealed.chunkMetadata.hash

    if (typeof hash === 'object') {
      try {
        hash = Buffer.from(hash.data)
      } catch(err) {
        throw new Error('hash parse err - driver.downstream')
      }
    }
    return await this.downstreamChunkProcessingPipeLine(
      chunks, hash, sealingKey, ipfs, outputPath
    )
  }

  private static async downstreamChunkProcessingPipeLine(
    chunks: {}, 
    hash: Uint8Array, 
    sealingKey: Uint8Array, 
    ipfs: IPFS, 
    outputPath: string
  ) {

    let currentHash : Uint8Array

    for (let chunkId in chunks) {

      let cid = chunks[chunkId].ipfsCID
      let rawChunkSize = chunks[chunkId].rawChunkSize

      let chunk : any = await ipfs.cat(cid)
      chunk = Util.hexToU8a(chunk)

      chunk = SecretBox.decrypt(sealingKey, chunk)
      chunk = await File.inflatDeflatedChunk(chunk)
      

      if (currentHash === undefined) {
        currentHash = await File.getChunkHash(chunk)
      } else {
        currentHash = await File.getCombinedChunkHash(currentHash, chunk)
      }
      
      if (chunk.length != rawChunkSize) {
        throw new Error('chunk size error: Driver.downstreamChunkProcessingPipeLine')
      }

      await File.writeFile(Buffer.from(chunk), outputPath, 'a')

    }
    if (Buffer.compare(currentHash, hash) !== 0) {
      throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine')
    }
  }

  public static async updateEncryptionSchema(
    vaultId: number, 
    newEncryptionSchema: EncryptionSchema,
    seed: string,
    keys: Uint8Array[],
    ipfs: IPFS,
    blockchain: Blockchain
  ) {
    const unsealed = await Driver.getMetadataByVaultId(vaultId, blockchain, ipfs, keys)
    const chunks = Chunks.parse(Util.serialize(unsealed.chunkMetadata))

    // TODO: check if sealingKey existis

    const metadata = new Metadata(
      chunks, new Seal(newEncryptionSchema, seed, unsealed.sealingKey)
    )

    let sealedData: any = metadata.generateSealedMetadata()

    sealedData = Util.serialize(sealedData)
    sealedData = stringToU8a(sealedData)
    sealedData = await File.deflatChunk(sealedData)
    sealedData = Util.u8aToHex(sealedData)

    await blockchain.init()
    const storage = blockchain.storage
    const contract = blockchain.contract

    const result = await ipfs.add(sealedData)
    const cidList = [{
      'cid': result.cid.toString(),
      'size': result.size
    }]

    // @ts-ignore
    const storageResult = await storage.placeBatchOrderWithCIDList(cidList)

    if (storageResult) {
      // @ts-ignore
      // await storage.awaitNetworkFetching(cidList)
      const contractResult = contract.execContract(
        'updateMetadata', [vaultId, result.cid.toString()]
      )
      return contractResult
    }
    return null
  }
}

export { Driver }
