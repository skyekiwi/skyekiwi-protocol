import * as SkyeKiwi from '../src/index'
import { expect } from 'chai';
import { randomBytes } from 'tweetnacl'
import {
  stringToU8a,
  u8aToString
} from '@polkadot/util'

require('dotenv').config();

describe('Encryption', () => {

  const key: Uint8Array = randomBytes(32)

  const symmetric = new SkyeKiwi.SecretBox(key)
  const asymmetric = new SkyeKiwi.Box(key)

  const message = '123456780123456'
  const message_u8a = stringToU8a(message)

  it('Symmetric: Encryption & Decryption Works', () => {
    const encrypted = symmetric.encrypt(message_u8a)
    const decrypted = SkyeKiwi.SecretBox.decrypt(key, encrypted)
    const decrypted_string = u8aToString(decrypted)
    expect(decrypted_string).to.equal(message)
  })

  it('Asymmetric: Encryption & Decryption Works', () => {

    const receiver_privateKey = randomBytes(32)
    const receiver_publicKey = SkyeKiwi.Box.getPublicKeyFromPrivateKey(receiver_privateKey)

    const sender_publicKey = asymmetric.getPublicKey()
    const encrypted = asymmetric.encrypt(message_u8a, receiver_publicKey)

    const decrypted = SkyeKiwi.Box.decrypt(encrypted, receiver_privateKey, sender_publicKey)
    const decrypted_string = u8aToString(decrypted)
    expect(decrypted_string).to.equal(message)
  })

  it('Symmetric: Decryption Fails w/Wrong Key', () => {
    const wrong_key = randomBytes(32)
    const encrypted = symmetric.encrypt(message_u8a)
    expect(() => SkyeKiwi.SecretBox.decrypt(wrong_key, encrypted)).to.throw(
      "decryption failed - SecretBox.decrypt"
    )
  })

  it('Asymmetric: Decryption Fails w/Wrong Key', () => {
    const receiver_privateKey = randomBytes(32)
    const receiver_publicKey = SkyeKiwi.Box.getPublicKeyFromPrivateKey(receiver_privateKey)

    const sender_publicKey = asymmetric.getPublicKey()
    const encrypted = asymmetric.encrypt(message_u8a, receiver_publicKey)

    // wrong sender's public key
    // the receiver's public key is sent instead of the sender's public key
    expect(() => SkyeKiwi.Box.decrypt(encrypted, receiver_privateKey, receiver_publicKey)).to.throw(
      'decryption failed - Box.decrypt'
    )

    // wrong receiver's private key
    const wrong_private_key = randomBytes(32)
    expect(() => SkyeKiwi.Box.decrypt(encrypted, wrong_private_key, sender_publicKey)).to.throw(
      'decryption failed - Box.decrypt'
    )
  })

  it('TSS: Sharing Works', () => {
    const shares = SkyeKiwi.TSS.generateShares(
      message_u8a, 5, 3
    )

    expect(shares.length).to.equal(5)
    expect(SkyeKiwi.Util.u8aToHex(SkyeKiwi.TSS.recover(shares)))
      .to.equal(SkyeKiwi.Util.u8aToHex(message_u8a))

    // delete the last peice of share, it should still be able to recover
    shares.pop()
    expect(SkyeKiwi.Util.u8aToHex(SkyeKiwi.TSS.recover(shares)))
      .to.equal(SkyeKiwi.Util.u8aToHex(message_u8a))

    // 3 shares should also be able to decrypt
    shares.pop()
    expect(SkyeKiwi.Util.u8aToHex(SkyeKiwi.TSS.recover(shares)))
      .to.equal(SkyeKiwi.Util.u8aToHex(message_u8a))

    // less than 3 shares will fail 
    shares.pop()
    expect(() => SkyeKiwi.TSS.recover(shares)).to.throw(
      'decryption failed, most likely because threshold is not met - TSS.recover'
    )

    shares.pop()
    expect(() => SkyeKiwi.TSS.recover(shares)).to.throw(
      'decryption failed, most likely because threshold is not met - TSS.recover'
    )
  })

})
