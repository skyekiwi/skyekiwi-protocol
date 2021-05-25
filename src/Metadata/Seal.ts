import { EncryptionSchema, TSS, Box } from '../index'
import { randomBytes } from 'tweetnacl'
import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'

// 32 bytes
const SKYEKIWI_SECRETS_ENDING = Uint8Array.from(Buffer.from(
    '244ccad30a21fbadd7330bf9d187a6dd26d464cb4da4eb4a61a55670b37b2619', 
    'hex'
  )
)

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

  public encrypt(message: Uint8Array) {
    
    let public_shares: any[] = []
    let private_shares: any[] = []
    
    this.encryptionSchema.author = this.box.getPublicKey()

    const shares = TSS.generateShares(
      this.wrapMessageWithSkyeKiwiEnding(message),
      this.encryptionSchema.numOfShares,
      this.encryptionSchema.threshold
    )

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

  public recover(public_pieces: [], private_pieces: [],
    keyPairs: {}, originalMessageLength: number) : Uint8Array {

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

      let result = TSS.recover(shares);
      if (result.slice(originalMessageLength, result.length) != SKYEKIWI_SECRETS_ENDING) {
        throw new Error("decryption failed, most likely because threshold is not met - EncryptionKeyMetadata.recover")
      }
      result = this.unwrapMessageWithSkyeKiwiEnding(result)

      if (result.length != originalMessageLength) {
        throw new Error("decryption failed, key length err - EncryptionKeyMetadata.recover")
      }
      return result;
  }

  public static getPublicSealingKey(sealingKey: Uint8Array) : Uint8Array {
    return Box.getPublicKeyFromPrivateKey(sealingKey)
  }

  public static getPublicAuthorKey(mnemonic: string) : Uint8Array {
    return Box.getPublicKeyFromPrivateKey(mnemonicToMiniSecret(mnemonic))
  }

  private wrapMessageWithSkyeKiwiEnding(message: Uint8Array) {
    let result = new Uint8Array(message.length + SKYEKIWI_SECRETS_ENDING.length)
    result.set(message, 0)
    result.set(SKYEKIWI_SECRETS_ENDING, message.length)
    return result
  }

  private unwrapMessageWithSkyeKiwiEnding(message: Uint8Array) {
    return message.slice(0, message.length - SKYEKIWI_SECRETS_ENDING.length)
  }
}
