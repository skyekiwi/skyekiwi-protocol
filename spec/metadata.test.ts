import * as SkyeKiwi from '../src/index'
import { expect } from 'chai';
import path from 'path'
import { randomBytes } from 'tweetnacl'
import {
  stringToU8a,
  u8aToString
} from '@polkadot/util'
import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'


import fs from 'fs'

require('dotenv').config();

const file1Path = path.join(__dirname, '/tmp/metadata.file1')
const file2Path = path.join(__dirname, '/tmp/metadata.file2')

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

  await SkyeKiwi.Util.writeFile(content1, file1Path, 'a')
  await SkyeKiwi.Util.writeFile(content2, file2Path, 'a')

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

describe('Metadata', function () {

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

  it('Seal: sealing & recover works', async () => {
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

  it('Chunks: chunks are recorded well & CID list matches', async () => {
    const { file1 } = await setup()

    const chunks1 = new SkyeKiwi.Chunks(file1)

    const ipfs = new SkyeKiwi.IPFS()
    let chunkId = 0

    let cids = []
    for await (const chunk of file1.readStream) {
      const cid = await ipfs.add(SkyeKiwi.Util.u8aToHex(chunk))
      chunks1.writeChunkResult(
        chunkId, chunk.length, cid.size, cid.cid
      )
      chunkId++
      cids.push(cid)
    }

    const cidList = chunks1.getCIDList()
    expect(cidList.length).to.equal(cids.length)
    for (let i = 0; i < cidList.length; i++) {
      expect(cidList[i].cid).to.equal(cids[i].cid)
      expect(cidList[i].size).to.equal(cids[i].size)
    }

    await ipfs.stopIfRunning()
    await cleanup()
  })
})
