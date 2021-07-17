import { EncryptionSchema, TSS, AsymmetricEncryption, Util } from '../index'
import { randomBytes } from 'tweetnacl'
import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'

export class Seal {

  // 32 bytes length
  public sealingKey: Uint8Array

  // 32 bytes length
  public blockchainPrivateKey: Uint8Array
  public mnemonic: string

  public encryptionSchema: EncryptionSchema

  constructor(config: {
    encryptionSchema: EncryptionSchema,
    seed?: string,
    sealingKey?: Uint8Array
  }) {

    this.mnemonic = config.seed ? config.seed : mnemonicGenerate()

    // if no secretBoxKey supplied, generate a random key
    this.sealingKey = config.sealingKey ? config.sealingKey : randomBytes(32);

    // mnemonic has 12 words
    if (this.mnemonic.split(' ').length !== 12) {
      throw new Error('mnemonic length error - Seal.constructor');
    }

    // SecretBoxKey is 32 bytes long
    if (config.sealingKey && config.sealingKey.length !== 32) {
      throw new Error('SecretBox key length error, should be 32 bytes long - Seal.contructor');
    }

    this.blockchainPrivateKey = mnemonicToMiniSecret(this.mnemonic);
    this.encryptionSchema = config.encryptionSchema
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
    
    this.encryptionSchema.author = AsymmetricEncryption
      .getPublicKey(this.blockchainPrivateKey)

    const shares = TSS.generateShares(
      message,
      this.encryptionSchema.numOfShares,
      this.encryptionSchema.threshold
    )

    for (let i = 0; i < this.encryptionSchema.unencryptedPieceCount; i ++) {
      public_shares.push(shares.pop())
    }

    for (let index in this.encryptionSchema.members) {
      private_shares.push(
        AsymmetricEncryption.encrypt(
          this.blockchainPrivateKey,
          shares.pop(),
          this.encryptionSchema.members[index]
        )
      )
    }

    let publicSharesHex = ""
    let privateSharesHex = ""

    for (let share of public_shares) {
      publicSharesHex += Util.u8aToHex(share) + "|"
    }
    publicSharesHex = Util.trimEnding(publicSharesHex)

    for (let share of private_shares) {
      privateSharesHex += Util.u8aToHex(share) + "|"
    }
    privateSharesHex = Util.trimEnding(privateSharesHex)
    return {
      "public": publicSharesHex,
      "private": privateSharesHex
    }
  }

  public static recover(config: {
    public_pieces: Uint8Array[], 
    private_pieces: Uint8Array[], 
    keys: Uint8Array[], 
    orignalAuthor: Uint8Array
  }) : Uint8Array {


    const {public_pieces, private_pieces, keys, orignalAuthor} = config

    let shares: Uint8Array[] = []
    shares = [...public_pieces]
    for (let piece of private_pieces) {
      for (let key in keys) {
        try {
          const decrypted = AsymmetricEncryption.decrypt(
            keys[key], piece, orignalAuthor
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
    return AsymmetricEncryption.getPublicKey(this.sealingKey)
  }

  public getPublicAuthorKey() : Uint8Array {
    return AsymmetricEncryption.getPublicKey(this.blockchainPrivateKey)
  }
}
