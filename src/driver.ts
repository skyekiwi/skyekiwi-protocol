import { stringToU8a, u8aToString } from '@polkadot/util';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto';
import {
  // EncryptionSchema, 
  Metadata, Seal, EncryptionSchema, Chunks,
  File, Util, Blockchain,

  IPFS,
  SecretBox
} from './index'

class Driver {

  private metadata: Metadata
  private blockchain: Blockchain

  constructor(
    public encryptionSchema: EncryptionSchema,
    public file: File,
    public seal: Seal,
    public ipfs: IPFS
  ) {
    this.file = file;
    this.metadata = new Metadata(
      new Chunks(file), seal
    )

    const abi = require('../contract/artifacts/skyekiwi.json')

    this.blockchain = new Blockchain(
      // seed phrase
      this.seal.mnemonic,
      // contract address
      '3hBx1oKmeK3YzCxkiFh6Le2tJXBYgg6pRhT7VGVL4yaNiERF',
      // contract instance endpoint
      'wss://jupiter-poa.elara.patract.io',
      // storage network endpoint
      'wss://rocky-api.crust.network/',
      // contract abi
      abi
    )
  }

  public async upstream() {
    
    let chunkCount = 0;
    console.log('file size:', this.file.fileSize());
    console.log('total chunks', this.file.fileChunkCount());

    const readStream = this.file.getReadStream()

    for await (const chunk of readStream) {
      await this.upstreamChunkProcessingPipeLine(chunk, chunkCount++, this.ipfs);
      console.log("finished", chunkCount)
    }

    let cidList = this.metadata.chunks.getCIDList()

    // now let's compress and process the sealedData
    let sealedData : any = this.metadata.generateSealedMetadata()
    sealedData = Util.serialize(sealedData)
    sealedData = stringToU8a(sealedData)
    sealedData = await File.deflatChunk(sealedData)
    sealedData = Util.u8aToHex(sealedData)

    const result = await this.ipfs.add(sealedData)
    cidList.push({
      'cid': result.cid.toString(),
      'size': result.size
    })
    
    await this.blockchain.init()
    const storage = this.blockchain.storage
    const contract = this.blockchain.contract

    // @ts-ignore
    const storageResult = await storage.placeBatchOrderWithCIDList(cidList)
    
    // TODO: wait when the order is picked up .... TBI
    if (storageResult) {
     const contractResult = await contract.execContract('createVault', [
       result.cid.toString()
     ])

      console.log(contractResult)
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
      this.metadata.chunks.hash = File.getChunkHash(chunk);
    } else {
      this.metadata.chunks.hash = File.getCombinedChunkHash(
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

  // TODO: seed should not be necessary? 
  public static async downstream(
    vaultId: number,
    blockchain: Blockchain, 
    ipfs: IPFS, 
    seed: string,
    outputPath: string
  ) {
    await blockchain.init()
    const contract = blockchain.contract

    const contractResult = (await contract.queryContract('getMetadata', [vaultId])).output.toString()

    let metadata : any = await ipfs.cat(contractResult)

    // revert the metadata compressing process 
    metadata = Util.hexToU8a(metadata)
    metadata = await File.inflatDeflatedChunk(metadata)
    metadata = u8aToString(metadata)
    metadata = Util.parse(metadata)

    const privateKey = mnemonicToMiniSecret(seed)
    let keys = [privateKey]

    let unsealed : any = Seal.recover(
      metadata.public, metadata.private, keys, metadata.author
    )
    unsealed = u8aToString(unsealed)
    unsealed = Util.parse(unsealed)

    const sealingKey = unsealed.sealing_key
    const chunks = unsealed.chunk_metadata.chunkStats
    const hash = unsealed.chunk_metadata.hash

    await this.downstreamChunkProcessingPipeLine(
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
        currentHash = File.getChunkHash(chunk)
      } else {
        currentHash = File.getCombinedChunkHash(currentHash, chunk)
      }
      
      if (chunk.length != rawChunkSize) {
        throw new Error('chunk size error: Driver.downstreamChunkProcessingPipeLine')
      }

      // writeFile APPENDS to existing file
      await Util.writeFile(Buffer.from(chunk), outputPath)
    }
    if (Buffer.compare(currentHash, hash) !== 0) {
      throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine')
    }
  }
}

export { Driver }
