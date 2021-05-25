import { IPFS } from './index'

class EncryptionSchema {
  constructor(
    public pieces: number,
    public quorum: number,
    public publicPieceCount: number,
    public metadata_ipfs: IPFS,
    public public_pieces_ipfs: IPFS,
    public members: { [publicKey: string]: IPFS }
  ) {}
}

class Metadata {
  constructor(
    public name: string,
    public note: string,
    public nonce: number,

    public encryptionSchema: EncryptionSchema,
    public publicShares: Array<string>,
    public pieces: { [publicKey: string]: string }
  ) {}
}

class FileChunk {
  constructor(
    public file: File,
    public hexContent: string,
    public rawContent: string
  ) {}
}

class IPFSConfig {
  constructor(
    public host: string,
    public port: number,
    public protocol: 'https' | 'http' | 'ws'
  ) {}

  public toString() {
    return JSON.stringify({
      host: this.host,
      port: this.port,
      protocol: this.protocol
    })
  }
}
export { EncryptionSchema, Metadata, IPFSConfig, FileChunk}
