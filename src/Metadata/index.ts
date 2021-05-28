import { EncryptionSchema } from './EncryptionSchema'
import { Chunks } from './Chunks'
import { Seal } from './Seal'
import {
  stringToU8a
} from '@polkadot/util'
import {Util} from '../index'

export {
  Chunks, Seal, EncryptionSchema
}

export const SKYEKIWI_VERSION = "0.1.0";

export class Metadata {

  constructor (
    public chunks: Chunks, 
    public seal: Seal
  ) {}

  // constructor(
  //   file: File,
  //   encryptionSchema: EncryptionSchema,
  //   mnemonic?: string, sealingKey?: Uint8Array
  // ) {
  //   this.seal = new Seal(encryptionSchema, mnemonic, sealingKey)
  //   this.chunks = new Chunks(file)
  // }

  public getCIDList() {
    return this.chunks.getCIDList()
  }

  public updateEncryptionSchema(newEncryptionSchema: EncryptionSchema) {
    this.seal.updateEncryptionSchema(newEncryptionSchema)
  }
  
  public generatePreSealingMetadata() {
    return {
      sealing_key: this.seal.sealingKey,
      chunk_metadata: this.chunks,
      root_hash: this.chunks.hash,
      author: this.seal.getPublicAuthorKey(),
      protocol_version: SKYEKIWI_VERSION,
    }
  }

  public generateSealedMetadata() {
    const sealed = this.seal.seal(
      stringToU8a(
        JSON.stringify(
          this.generatePreSealingMetadata())
      )
    )

    return {
      public_sealing_key: this.seal.getPublicSealingKey(),
      ... this.seal.digestEncryptionSchema(),
      public: sealed.public,
      private: sealed.private,
      protocol_version: SKYEKIWI_VERSION,
    }
  }

  public serialize() {
    return Util.serialize({
      chunks: this.chunks.serialize(),
      seal: this.seal.serialize
    })
  }

  public static parse(str: string) {
    const object = Util.parse(str)
    object.chunks = Util.parse(object.chunks)
    object.seal = Util.parse(object.seal)
    return new Metadata(
      object.chunks, object.seal
    )
  }
}
