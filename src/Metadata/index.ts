import { EncryptionSchema } from '../index'
import {Chunks} from './Chunks'
import {RawFile} from './RawFile'
import { Seal } from './Seal'

export {
  Chunks, RawFile, Seal
}

export const SKYEKIWI_VERSION = "0.1.0";

export class Metadata {

  public chunks: Chunks  
  public seal: Seal

  private encryptionSchema: EncryptionSchema

  constructor(
    rawFile: RawFile,
    encryptionSchema: EncryptionSchema,
    mnemonic?: string, sealingKey?: Uint8Array,
  ) {
    this.seal = new Seal(encryptionSchema, mnemonic, sealingKey)
    this.chunks = new Chunks(rawFile)
    this.encryptionSchema = encryptionSchema
  }
  public getCIDList() {
    
  }
  
  public generatePreSealingMetadata() {
    return {
      sealing_key: this.u8aToHex(this.seal.sealingKey),
      chunk_metadata: this.chunks.toString(),
      root_hash: this.u8aToHex(this.chunks.hash),
      author: this.u8aToHex(this.encryptionSchema.author),

      protocol_version: SKYEKIWI_VERSION,
    }
  }

  public generateSealedMetadata() {
    const sealing = this.seal.encrypt(
      this.hexToU8a(
        JSON.stringify(this.generatePreSealingMetadata())
      )
    )

    return {
      public_sealing_key: this.u8aToHex(Seal.getPublicSealingKey(this.seal.sealingKey)),
      numOfShares: this.encryptionSchema.numOfShares,
      threshold: this.encryptionSchema.threshold,

      public: sealing.public,
      private: sealing.private,


      numOfParticipants: this.encryptionSchema.getNumOfParticipants(),
      protocol_version: SKYEKIWI_VERSION,
    }
  }

  private u8aToHex(x: Uint8Array) {
    return Buffer.from(x).toString('hex')
  }
  private hexToU8a(x: string) {
    const encoder = new TextEncoder();
    return encoder.encode(x);
  }
}


