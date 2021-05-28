import * as SkyeKiwi from '../src/index'
import { expect } from 'chai';
import path from 'path'
import {randomBytes} from 'tweetnacl'
import {
  stringToU8a,
  u8aToString
} from '@polkadot/util'
import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'

import fs from 'fs'

require('dotenv').config();

const file1Path = path.join(__dirname, '/tmp/tmp.file1')
const file2Path = path.join(__dirname, '/tmp/tmp.file2')

const setup = async () => {
  // we are creating two files here:
  // tmp.file1 - a 120MB file with random bytes
  // tmp.file2 - a 119MB file with repeating byte of '187'

  const content1 = Buffer.from(randomBytes(120000000))
  const content2 = Buffer.alloc(119000000, 187)

  await SkyeKiwi.Util.writeFile(content1, file1Path)
  await SkyeKiwi.Util.writeFile(content2, file2Path)

  // RawFile has a default chunk size of 120MB.
  // we are making it 10MB here to demostrate it works
  const file1 = new SkyeKiwi.File(
    file1Path,
    'tmp.file1',
    'a testing file with 120MB random bytes',
    1 * (10 ** 7)
  )
  const file2 = new SkyeKiwi.File(
    file2Path,
    'tmp.file2',
    'a testing file with 119MB repeating 187 byte',
    1 * (10 ** 7)
  )

  return { file1, file2 }
}
const cleanup = async () => {
  const unlink = (filePath) => {
    return new Promise((res, rej) => {
      fs.unlink(filePath, (err) => {
        if (err) rej(err)
        res(true)
      });
    });
  }
  await unlink(file1Path)
  await unlink(file2Path)
}

describe('Encryption', () => {

  const key : Uint8Array = randomBytes(32)

  const symmetric = new SkyeKiwi.SecretBox(key)
  const asymmetric = new SkyeKiwi.Box(key)

  const message = '123456780123456'
  const message_u8a = stringToU8a(message)

  it('Symmetric: Encryption & Decryption Works', () => {
    const encrypted = symmetric.encrypt(message_u8a)
    const decrypted = SkyeKiwi.SecretBox.decrypt(key ,encrypted)
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

describe('File', function() {
  this.timeout(15000)

  it('File: file size reads well', async() => {
    const { file1, file2 } = await setup()

    const size1 = file1.fileSize()
    const size2 = file2.fileSize()

    expect(size1).to.equal(120000000)
    expect(size2).to.equal(119000000)

    await cleanup()
  })

  it('File: file chunk count calculated correctly', async() => {
    const {file1, file2} = await setup()
    const chunk1 = file1.fileChunkCount()
    const chunk2 = file2.fileChunkCount()

    expect(chunk1).to.equal(12)
    expect(chunk2).to.equal(12)
    
    await cleanup()
  })

  it('File: chunk hash calculation works', async () => {
    let { file1, file2 } = await setup()
    const stream1 = file1.getReadStream()
    const stream2 = file2.getReadStream()

    let hash1, hash2
    let result = {
      0: [],
      1: []
    }

    // file2 hash under chunk size of 10MB
    // the hash will be different when chunk size is different 
    const file2Hash = 'ec8fb30fa63c26b1dd0c3bbac108388527344dfa3debe7b9bb1380c837073495'

    for (let loop = 0; loop < 2; loop ++) {

      for await (const chunk of stream1) {
        if (hash1 === undefined) {
          hash1 = SkyeKiwi.File.getChunkHash(chunk)
        } else {
          hash1 = SkyeKiwi.File.getCombinedChunkHash(
            hash1, chunk
          )
        }
      }

      for await (const chunk of stream2) {
        if (hash2 === undefined) {
          hash2 = SkyeKiwi.File.getChunkHash(chunk)
        } else {
          hash2 = SkyeKiwi.File.getCombinedChunkHash(
            hash2, chunk
          )
        }
      }

      result[loop] = [hash1, hash2]
    }

    const hash1_0 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[0][0]))
    const hash2_0 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[0][1]))
    const hash1_1 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[1][0]))
    const hash2_1 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[1][1]))

    expect(hash2_0).to.equal(file2Hash)
    expect(hash2_1).to.equal(file2Hash)
    expect(hash1_0).to.equal(hash1_1)

    await cleanup()
  })

  it('File: inflate & deflat work', async () => {
    let { file1, file2 } = await setup()
    const stream1 = file1.getReadStream()
    const stream2 = file2.getReadStream()

    for await (const chunk of stream1) {
      const deflatedChunk = await SkyeKiwi.File.deflatChunk(chunk)
      const inflatedChunk = await SkyeKiwi.File.inflatDeflatedChunk(deflatedChunk)

      expect(inflatedChunk).to.deep.equal(chunk)
    }

    for await (const chunk of stream2) {
      const deflatedChunk = await SkyeKiwi.File.deflatChunk(chunk)
      const inflatedChunk = await SkyeKiwi.File.inflatDeflatedChunk(deflatedChunk)

      expect(inflatedChunk).to.deep.equal(chunk)
    }
  })
})

describe('IPFS Client', function() {
  this.timeout(15000)

  const ipfs_config = new SkyeKiwi.IPFSConfig(
    'ipfs.infura.io', 5001, 'https'
  )

  const ipfs = new SkyeKiwi.IPFS(ipfs_config)
  const testString = "abcdejkjlkasdjfklajskldfjlkasjdklfjklsdjfklasjdlkfj"

  it('uploads some content to IPFS', async () => {
    await ipfs.add(testString)
  })

  it('fetch content by CID on IPFS', async () => {
    const result = await ipfs.add(testString)
    const content = await ipfs.cat(result.cid.toString())
    expect(content).to.equal(testString)
  })

  it('pins a CID on Infura IPFS', async () => {
    const result = await ipfs.add(testString)
    await ipfs.pin(result.cid)
  })
})

describe('Metadata', () => {

  const mnemonic = mnemonicGenerate()
  const mnemonic2 = mnemonicGenerate()
  const mnemonic3 = mnemonicGenerate()

  const sealingKey = randomBytes(32)

  const author_privateKey = mnemonicToMiniSecret(mnemonic)
  const privateKey2 = mnemonicToMiniSecret(mnemonic2)
  const privateKey3 = mnemonicToMiniSecret(mnemonic3)

  const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(author_privateKey)
  const publicKey2 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey2)
  const publicKey3 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey3)

  // given 5 pieces, threshold = 3, 1 public piece 
  const encryptionSchema = new SkyeKiwi.EncryptionSchema(
    5, 3, author, 1
  )

  encryptionSchema.addMember(author, 2)
  encryptionSchema.addMember(publicKey2, 1)
  encryptionSchema.addMember(publicKey3, 1)

  const seal = new SkyeKiwi.Seal(encryptionSchema, mnemonic, sealingKey)
  
  it('Seal: sealing & recover works', async() => {
    const message = "{a testing metadata ... }"
    const message_u8a = stringToU8a(message)

    const sealed = seal.seal(message_u8a)

    let keypairs = {}
    
    // 2 piece
    keypairs[SkyeKiwi.Util.u8aToHex(author)] = author_privateKey
    
    // 1 piece - can be uncommonted 
    // keypairs[SkyeKiwi.Util.u8aToHex(publicKey2)] = privateKey2
    
    // 1 piece - can be uncommonted 
    // keypairs[SkyeKiwi.Util.u8aToHex(publicKey3)] = privateKey3

    const recovered = seal.recover(
      sealed["public"], 
      sealed["private"],
      keypairs
    )

    expect(u8aToString(recovered)).to.equal(message)
  })

  
})

describe('Blockchain', () => {


})
