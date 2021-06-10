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
  // tmp.file1 - a 1.2MB file with random bytes
  // tmp.file2 - a 1.19MB file with repeating byte of '187'

  try {
    cleanup()
  } catch (err) {
    // pass
  }

  const content1 = Buffer.from(randomBytes(1200000))
  const content2 = Buffer.alloc(1190000, 187)

  await SkyeKiwi.Util.writeFile(content1, file1Path)
  await SkyeKiwi.Util.writeFile(content2, file2Path)

  // SkyeKiwi.File has a default chunk size of 100MB.
  // we are making it 0.1MB here to demostrate it works
  const file1 = new SkyeKiwi.File(
    file1Path,
    'tmp.file1',
    'a testing file with 120MB random bytes',
    1 * (10 ** 5)
  )
  const file2 = new SkyeKiwi.File(
    file2Path,
    'tmp.file2',
    'a testing file with 119MB repeating 187 byte',
    1 * (10 ** 5)
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

    expect(size1).to.equal(1200000)
    expect(size2).to.equal(1190000)

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

    // file2 hash under chunk size of 0.1MB
    // the hash will be different when chunk size is different 
    const file2Hash = '643ff196e1568bdd5b1ba0e6bd1d131cd273caa818973527fdd6179efdad2c37'

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
  this.timeout(0)

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

  it('ipfs fallback test', async() => {

    // when the config is intentionally wrong
    const wrong_ipfs_config = new SkyeKiwi.IPFSConfig(
      'sfpi.infura.io', 5001, 'https'
    )
    const wrong_ipfs = new SkyeKiwi.IPFS(wrong_ipfs_config)

    for (let i = 0; i < 10; i ++) {
      const data = randomBytes(1000)
      const data_hex = SkyeKiwi.Util.u8aToHex(data)
      await wrong_ipfs.add(data_hex)
    }
  })
})

describe('Metadata', function() {

  this.timeout(100000)

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

    let keypairs = []
    
    // 2 piece
    keypairs.push(author_privateKey)
    
    // 1 piece - can be uncommonted 
    // keypairs.push(privateKey2)
    
    // 1 piece - can be uncommonted 
    // keypairs.push(privateKey3)

    const recovered = SkyeKiwi.Seal.recover(
      sealed["public"], 
      sealed["private"],
      keypairs,
      author
    )

    expect(u8aToString(recovered)).to.equal(message)
  })

  it('Chunks: chunks are recorded well & CID list matches', async() => {
    const {file1} = await setup()

    const chunks1 = new SkyeKiwi.Chunks(file1)

    const ipfsConfig = new SkyeKiwi.IPFSConfig(
      'ipfs.infura.io', 5001, 'https'
    )

    const ipfs = new SkyeKiwi.IPFS(ipfsConfig)
    let chunkId = 0

    let cids = []
    for await (const chunk of file1.readStream) {
      const cid = await ipfs.add(SkyeKiwi.Util.u8aToHex(chunk))
      chunks1.writeChunkResult(
        chunkId, chunk.length, cid.size, cid.cid.toString()
      )
      chunkId ++
      cids.push(cid)
    }

    const cidList = chunks1.getCIDList()
    expect(cidList.length).to.equal(cids.length)
    for (let i = 0; i < cidList.length; i ++) {
      expect(cidList[i].cid).to.equal(cids[i].cid.toString())
      expect(cidList[i].size).to.equal(cids[i].size)
    }
    await cleanup()
  })
})

describe('Blockchain', function() {

  this.timeout(100000)

  const abi = require('../contract/artifacts/skyekiwi.json')

  // to run a local canvas blockchain ...
  // const { execSync } = require("child_process")
  // execSync('canvas --dev --tmp')
  
  it('Blockchain: send contract tx & storage order works', async() => {
    const mnemonic = process.env.SEED_PHRASE
    const blockchain = new SkyeKiwi.Blockchain(
      mnemonic,
      '3cNizgEgkjB8TKm8FGJD3mtcxNTwBRxWrCwa77rNTq3WaZsM',
      'wss://jupiter-poa.elara.patract.io',
      'wss://api.crust.network/',
      abi)

    await blockchain.init()
    
    const storage = blockchain.storage
    const contract = blockchain.contract
    
    let content = []
    for (let i = 0; i < 3; i++) {
      content.push(randomBytes(1000))
    }

    const crustResult = await storage.placeBatchOrder(content)
    console.log(crustResult)
    expect(crustResult).to.equal(true)
  
    const contractResult = await contract.execContract(
    'createVault', ['QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm'])
    expect(contractResult['ok']).to.be.a('number')
  })
})
