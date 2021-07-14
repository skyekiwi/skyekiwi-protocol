import {
  // EncryptionSchema, 
  Metadata, Seal, EncryptionSchema,
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
      seal, ipfs
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
    let cidList:[{cid: string, size: number}] = this.metadata.getCIDList()

    // now let's compress and process the sealedData
    let sealedData : string = await this.metadata.generateSealedMetadata()

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
    if (this.metadata.hash === undefined) {
      this.metadata.hash = await File.getChunkHash(chunk);
    } else {
      this.metadata.hash = await File.getCombinedChunkHash(
        this.metadata.hash, chunk
      );
    }

    // 2. deflate the chunk
    chunk = await File.deflatChunk(chunk);

    // 3. SecretBox encryption
    chunk = (new SecretBox(this.metadata.seal.sealingKey)).encrypt(chunk)

    // 4. upload to IPFS
    const IPFS_CID = await ipfs.add(Util.u8aToHex(chunk))

    // 5. write to chunkMetadata
    this.metadata.writeChunkResult(
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
    metadata = Metadata.recoverSealedData(metadata)
    let unsealed: any = Seal.recover(
      metadata.public, metadata.private, keys, metadata.author
    )

    unsealed = await Metadata.recoverPreSealData(unsealed, ipfs)
    // console.log(unsealed)
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
    const chunks = unsealed.chunks

    let hash = unsealed.hash


    return await this.downstreamChunkProcessingPipeLine(
      chunks, hash, sealingKey, ipfs, outputPath
    )
  }

  private static async downstreamChunkProcessingPipeLine(
    chunks: [string], 
    hash: Uint8Array, 
    sealingKey: Uint8Array, 
    ipfs: IPFS, 
    outputPath: string
  ) {

    let currentHash : Uint8Array
    for (let chunkCID of chunks) {
      let chunk: any = await ipfs.cat(Util.u8aToString(Util.hexToU8a(chunkCID)))
      chunk = Util.hexToU8a(chunk)

      chunk = SecretBox.decrypt(sealingKey, chunk)
      chunk = await File.inflatDeflatedChunk(chunk)
      
      if (currentHash === undefined) {
        currentHash = await File.getChunkHash(chunk)
      } else {
        currentHash = await File.getCombinedChunkHash(currentHash, chunk)
      }

      await Driver.fileReady(chunk, outputPath)
    }
    if (Util.u8aToHex(currentHash) !== Util.u8aToHex(hash)) {
      throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine')
    }
  }

  public static async fileReady(chunk: Uint8Array, outputPath: string) {
    await File.writeFile(chunk, outputPath, 'a')
    return true
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

    const newSeal = new Seal(newEncryptionSchema, seed, unsealed.sealingKey)
    const reSealed = Metadata.packageSealed(
      newSeal,
      Metadata.packagePreSeal(
        newSeal, unsealed.hash, Util.stringToU8a(unsealed.chunksCID)
      )
    )

    await blockchain.init()
    const storage = blockchain.storage
    const contract = blockchain.contract

    const result = await ipfs.add(reSealed)
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
