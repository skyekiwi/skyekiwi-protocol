import { EncryptionSchema, TSS, Box, Util } from '../index'
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

    // if no secretBoxKey supplied, generate a random key
    this.sealingKey = sealingKey ? sealingKey : randomBytes(32);

    // mnemonic has 12 words
    if (mnemonic.split(' ').length !== 12) {
      throw new Error('mnemonic length error - Seal.constructor');
    }

    // SecretBoxKey is 32 bytes long
    if (sealingKey && sealingKey.length !== 32) {
      throw new Error('SecretBox key length error, should be 32 bytes long - Seal.contructor');
    }

    this.blockchainPrivateKey = mnemonicToMiniSecret(mnemonic);

    this.encryptionSchema = encryptionSchema
    this.box = new Box(this.blockchainPrivateKey)
  }

  public seal(message: Uint8Array) {
    
    let public_shares: Uint8Array[] = []
    let private_shares: Uint8Array[] = []
    
    // pieces = public piece(s) + members' piece(s)
    if (this.encryptionSchema.numOfShares !==
      this.encryptionSchema.unencryptedPieceCount +
      this.encryptionSchema.members.length) {

      throw new Error("wrong encryptionSchema supplied - Seal.seal")
    }

    // quorum > pieces : a vault that can never be decrypt
    if (this.encryptionSchema.threshold > this.encryptionSchema.numOfShares) {
      throw new Error("wrong encryptionSchema supplied - Seal.seal")
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

    for (let index in this.encryptionSchema.members) {
      private_shares.push(this.box.encrypt(shares.pop(), 
        this.encryptionSchema.members[index]))
    }

    return {
      "public": public_shares,
      "private": private_shares
    }
  }

  public static recover(public_pieces: Uint8Array[], private_pieces: Uint8Array[], 
    keys: Uint8Array[], orignalAuthor: Uint8Array) : Uint8Array {

    let shares: Uint8Array[] = []
    shares = [...public_pieces]
    for (let piece of private_pieces) {
      for (let key in keys) {
        try {
          const decrypted = Box.decrypt(
            piece, keys[key], orignalAuthor
          )
          if (decrypted) shares.push(decrypted)
        } catch(err) {
          // pass
        }
      }
    }
    return TSS.recover(shares);
  }

  public getPublicSealingKey() : Uint8Array {
    return Box.getPublicKeyFromPrivateKey(this.sealingKey)
  }

  public getPublicAuthorKey() : Uint8Array {
    return Box.getPublicKeyFromPrivateKey(this.blockchainPrivateKey)
  }

  public digestEncryptionSchema() {
    return {
      'numOfShares': this.encryptionSchema.numOfShares,
      'threshold': this.encryptionSchema.threshold,
      'numOfParticipants': this.encryptionSchema.getNumOfParticipants(),
      'author': Util.u8aToHex(this.encryptionSchema.author)
    }
  }

  public serialize() {
    console.warn("this is very risky for leaking private info - Seal.serialize")
    return Util.serialize({
      sealingKey: this.sealingKey,
      publicSealingKey: this.getPublicSealingKey(),
      author: this.getPublicAuthorKey(),

      blockchainPrivateKey: this.blockchainPrivateKey,
      mnemonic: this.mnemonic,
      encryptionSchema: this.encryptionSchema.serialize()
    })
  }

  public static parse(str: string) {
    const object = Util.parse(str)
    object.encryptionSchema = EncryptionSchema.parse(object.encryptionSchema)
    object.sealingKey = Util.parse(object.sealingKey)
    return new Seal(object.encryptionSchema, object.mnemonic, object.sealingKey)
  }
}
