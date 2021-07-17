import {
  // EncryptionSchema, 
  Metadata, Seal, EncryptionSchema,
  File, Util, Blockchain,

  IPFS,
  SymmetricEncryption
} from './index'

class Driver {

  public static async upstream(config: {
    file: File, seal: Seal, blockchain: Blockchain
  }) {
    
    const ipfs = new IPFS()
    const {file, seal, blockchain} = config
    const metadata = new Metadata({seal: seal})
    
    let chunkCount = 0;
    const readStream = file.getReadStream()

    for await (const chunk of readStream) {
      await Driver.upstreamChunkProcessingPipeLine(
        metadata, chunk, chunkCount++
      );
    }

    // @ts-ignore
    let cidList:[{cid: string, size: number}] = metadata.getCIDList()
    let sealedData : string = await metadata.generateSealedMetadata()

    const result = await ipfs.add(sealedData)
    cidList.push({
      'cid': result.cid,
      'size': result.size
    })
    
    await blockchain.init()
    const storage = blockchain.storage
    const contract = blockchain.contract

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

  private static async upstreamChunkProcessingPipeLine(
    metadata: Metadata, chunk: Uint8Array, chunkId: number
  ) {
    // 0. get raw chunk size
    const rawChunkSize = chunk.length;

    // 1. get hash, if this is the first chunk, get the hash
    //          else, get hash combined with last hash
    if (metadata.hash === undefined) {
      metadata.hash = await File.getChunkHash(chunk);
    } else {
      metadata.hash = await File.getCombinedChunkHash(
        metadata.hash, chunk
      );
    }

    // 2. deflate the chunk
    chunk = await File.deflatChunk(chunk);

    // 3. SecretBox encryption
    chunk = SymmetricEncryption.encrypt(metadata.seal.sealingKey, chunk)

    // 4. upload to IPFS
    const ipfs = new IPFS()
    const IPFS_CID = await ipfs.add(Util.u8aToHex(chunk))

    // 5. write to chunkMetadata
    metadata.writeChunkResult({
      chunkId: chunkId,
      rawChunkSize: rawChunkSize,
      ipfsChunkSize: IPFS_CID.size,
      ipfsCID: IPFS_CID.cid.toString()
    });
  }

  public static async getMetadataByVaultId(
    vaultId: number, 
    blockchain: Blockchain, 
    keys: Uint8Array[]
  ) {
    await blockchain.init()
    const contract = blockchain.contract
    const contractResult = (await contract
        .queryContract('getMetadata', [vaultId])
      ).output.toString()

    const ipfs = new IPFS()
    let metadata: any = await ipfs.cat(contractResult)

    // revert the metadata compressing process 
    metadata = Metadata.recoverSealedData(metadata)
    let unsealed: any = Seal.recover({
      public_pieces: metadata.public,
      private_pieces: metadata.private,
      keys: keys,
      orignalAuthor: metadata.author

    })

    unsealed = await Metadata.recoverPreSealData(unsealed)
    return unsealed
  }

  public static async downstream(config: {
    vaultId: number,
    blockchain: Blockchain,
    outputPath: string,
    keys: Uint8Array[]
  }) {
    const {vaultId, blockchain, outputPath, keys} = config
    const unsealed = await this.getMetadataByVaultId(vaultId, blockchain, keys)

    const sealingKey = unsealed.sealingKey
    const chunks = unsealed.chunks

    let hash = unsealed.hash


    return await this.downstreamChunkProcessingPipeLine(
      chunks, hash, sealingKey, outputPath
    )
  }

  private static async downstreamChunkProcessingPipeLine(
    chunks: [string], 
    hash: Uint8Array, 
    sealingKey: Uint8Array, 
    outputPath: string
  ) {

    const ipfs = new IPFS()
    let currentHash : Uint8Array
    for (let chunkCID of chunks) {
      let chunk: any = await ipfs.cat(chunkCID)
      chunk = Util.hexToU8a(chunk)

      chunk = SymmetricEncryption.decrypt(sealingKey, chunk)
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

  public static async updateEncryptionSchema(config: {
    vaultId: number, 
    newEncryptionSchema: EncryptionSchema,
    seed: string,
    keys: Uint8Array[],
    blockchain: Blockchain
  }) {
    const { vaultId, newEncryptionSchema, seed, keys, blockchain} = config

    const unsealed = await Driver.getMetadataByVaultId(vaultId, blockchain, keys)

    const newSeal = new Seal({
      encryptionSchema: newEncryptionSchema, 
      seed: seed, 
      sealingKey: unsealed.sealingKey
    })

    const reSealed = Metadata.packageSealed(
      newSeal,
      Metadata.packagePreSeal(
        newSeal, unsealed.hash, Util.stringToU8a(unsealed.chunksCID)
      )
    )

    await blockchain.init()
    const storage = blockchain.storage
    const contract = blockchain.contract

    const ipfs = new IPFS()
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
