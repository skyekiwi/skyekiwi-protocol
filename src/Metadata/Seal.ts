import { EncryptionSchema, TSS, Box } from '../index'
import { randomBytes } from 'tweetnacl'
import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'


export class Seal {

  // 32 bytes length
  public sealingKey: Uint8Array

  // 32 bytes length
  public blockchainPrivateKey: Uint8Array
  public mnemonic: string

  public encryptionSchema: EncryptionSchema

  private box: Box

  constructor(encryptionSchema: EncryptionSchema, 
    mnemonic?: string, sealingKey?: Uint8Array) {

    if (!mnemonic) {
      mnemonic = mnemonicGenerate()
    }

    this.mnemonic = mnemonic

    // mnemonic has 12 words
    if (mnemonic.split(' ').length !== 12) {
      throw new Error('mnemonic length error - KeyMetadata.constructor');
    }

    // SecretBoxKey is 32 bytes long
    if (sealingKey && sealingKey.length !== 32) {
      throw new Error('SecretBox key length error, should be 32 bytes long - KeyMetadata.contructor');
    }

    this.blockchainPrivateKey = mnemonicToMiniSecret(mnemonic);

    // if no secretBoxKey supplied, generate a random key
    this.sealingKey = sealingKey ? sealingKey : randomBytes(32);

    this.encryptionSchema = encryptionSchema

    this.box = new Box(this.blockchainPrivateKey)
  }

  public seal(message: Uint8Array) {
    
    let public_shares: any[] = []
    let private_shares: any[] = []
    
    // pieces = public piece(s) + members' piece(s)
    if (this.encryptionSchema.numOfShares !==
      this.encryptionSchema.unencryptedPieceCount +
      Object.keys(this.encryptionSchema.members).length) {

      throw new Error("wrong encryptionSchema supplied - EncryptionKeyMetadata.encrypt")
    }

    // quorum > pieces : a vault that can never be decrypt
    if (this.encryptionSchema.threshold > this.encryptionSchema.numOfShares) {
      throw new Error("wrong encryptionSchema supplied - EncryptionKeyMetadata.encrypt")
    }
    
    this.encryptionSchema.author = this.box.getPublicKey()

    const shares = TSS.generateShares(
      message,
      this.encryptionSchema.numOfShares,
      this.encryptionSchema.threshold
    )

    for (let i = 0; i < this.encryptionSchema.unencryptedPieceCount; i ++) {
      public_shares.push(shares.pop())
    }

    for (let member_hexstring in this.encryptionSchema.members) {

      let member = Uint8Array.from(Buffer.from(member_hexstring, 'hex'));
      private_shares.push(this.box.encrypt(shares.pop(), member))
    }

    return {
      "public": public_shares,
      "private": private_shares
    }
  }

  public recover(public_pieces: [], private_pieces: [], keyPairs: {}) : Uint8Array {

    let shares: Uint8Array[] = []
    public_pieces.map(item => {
      shares.push(item)
    })

    private_pieces.map(item => {
      for (let publicKey in keyPairs) {
        try {
          const decrypted = Box.decrypt(
            item, Uint8Array.from(keyPairs[publicKey]), this.encryptionSchema.author
          )
          if (decrypted) shares.push(decrypted)
        } catch(err) {}
      }
    })
    return TSS.recover(shares);
  }

  public static getPublicSealingKey(sealingKey: Uint8Array) : Uint8Array {
    return Box.getPublicKeyFromPrivateKey(sealingKey)
  }

  public static getPublicAuthorKey(mnemonic: string) : Uint8Array {
    return Box.getPublicKeyFromPrivateKey(mnemonicToMiniSecret(mnemonic))
  }
}
