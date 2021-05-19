import {
  // EncryptionSchema, 
  Metadata, RawFile, Seal, EncryptionSchema,
  File,

  IPFS,
  SecretBox
} from './index'

class Driver {

  private file: File
  private metadata: Metadata

  constructor(
    public encryptionSchema: EncryptionSchema,
    public rawFile: RawFile,
    public seal: Seal
  ) {
    this.file = new File(rawFile);
    this.metadata = new Metadata(
      rawFile, encryptionSchema, seal.mnemonic, seal.blockchainPrivateKey
    )
  }

  public async upstream() {
    
    let chunkCount = 0;
    console.log('file size:', this.file.fileSize());
    console.log('total chunks', this.file.fileChunkCount());

    const readStream = this.file.getReadStream()

    for await (const chunk of readStream) {
      await this.upstreamChunkProcessingPipeLine(chunk, chunkCount++);
      console.log("finished", chunkCount)
    }

    console.log(this.metadata.generatePreSealingMetadata())
    console.log(this.metadata.generateSealedMetadata())
  }

  private upstreamChunkProcessingPipeLine(chunk: Uint8Array, chunkId: number) {    
    
    return new Promise(async (resolves, rejects) => {
      try{
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
        const IPFS_CID = await(new IPFS({ host: 'localhost', port: 5001, protocol: 'http' }))
          .add(Buffer.from(chunk).toString());

        // 5. write to chunkMetadata
        this.metadata.chunks.writeChunkResult(
          chunkId, rawChunkSize, chunk.length, IPFS_CID.cid.toString()
        );

        resolves(true)
      } catch(err) {rejects(err)}
    });
  }

}

export { Driver }
