import * as SkyeKiwi from '../src/index'
import { mnemonicToMiniSecret } from '@polkadot/util-crypto'
import path from 'path'
require('dotenv').config();

import fs from 'fs'
import {expect} from 'chai'
import { randomBytes } from 'tweetnacl';
const filePath = path.join(__dirname, '/tmp/integration.file')
const downstreamPath = path.join(__dirname, '/tmp/integration.down')

const content = randomBytes(12000000)

const setup = async () => {
  try {
    await unlink(filePath)
    await unlink(downstreamPath)
  } catch(err) {
    // pass
  }

  // we are creating two files here:
  // tmp.file - a 12MB file of random bytes
  await SkyeKiwi.File.writeFile(Buffer.from(content), filePath, 'a')

  // SkyeKiwi.File has a default chunk size of 100MB.
  // we are making it 0.1MB here to demostrate it works
  const file = new SkyeKiwi.File(
    filePath,
    'tmp.file',
    'a testing file with 12MB random bytes',
    4 * (10 ** 6)
  )

  return file
}
const unlink = (filePath) => {
  return new Promise((res, rej) => {
    fs.unlink(filePath, (err) => {
      if (err) rej(err)
      res(true)
    });
  });
}

describe('Integration', function() {
  this.timeout(0)

  let vaultId1: number
  let vaultId2: number
  const abi = SkyeKiwi.getAbi()
  const mnemonic = process.env.SEED_PHRASE

  const blockchain = new SkyeKiwi.Blockchain(
    // seed phrase
    mnemonic,
    // contract address
    '3cNizgEgkjB8TKm8FGJD3mtcxNTwBRxWrCwa77rNTq3WaZsM',
    // contract instance endpoint
    'wss://jupiter-poa.elara.patract.io',
    // storage network endpoint
    'wss://rocky-api.crust.network/',
    // contract abi
    abi
  )

  it('upstream, author only', async () => {
    const fileHandle = await setup()

    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(
      mnemonicToMiniSecret(mnemonic)
    )

    const ipfs = new SkyeKiwi.IPFS()
    const encryptionSchema = new SkyeKiwi.EncryptionSchema(
      2, 2, author, 1
    )
    encryptionSchema.addMember(author, 1)
    
    const key = new SkyeKiwi.Seal(encryptionSchema, mnemonic)
    const skyekiwi = new SkyeKiwi.Driver(
      encryptionSchema,
      fileHandle,
      key,
      ipfs,
      blockchain
    )

    vaultId1 = await skyekiwi.upstream()

    await ipfs.stopIfRunning()
    await unlink(filePath)
  })

  it('downstream, author only', async () => {

    try {
      await unlink(downstreamPath)
    } catch (err) { }
    

    const ipfs = new SkyeKiwi.IPFS()

    await SkyeKiwi.Driver.downstream(
      vaultId1, blockchain, ipfs,
      downstreamPath, [mnemonicToMiniSecret(mnemonic)]
    )

    const downstreamContent = fs.readFileSync(downstreamPath)
    expect(Buffer.compare(downstreamContent, content)).to.equal(0)
    
    await ipfs.stopIfRunning()
    await unlink(downstreamPath)
  })

  const privateKey1 = randomBytes(32)
  const privateKey2 = randomBytes(32)

  const publicKey1 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey1)
  const publicKey2 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey2)

  it('upstream, two members + author', async () => {
    const fileHandle = await setup()

    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(
      mnemonicToMiniSecret(mnemonic)
    )

    const ipfs = new SkyeKiwi.IPFS()

    // Author can decrypt
    // two members can decrypt together but not by themselves
    const encryptionSchema = new SkyeKiwi.EncryptionSchema(
      5, 3, author, 1
    )
    encryptionSchema.addMember(author, 2)
    encryptionSchema.addMember(publicKey1, 1)
    encryptionSchema.addMember(publicKey2, 1)

    const key = new SkyeKiwi.Seal(encryptionSchema, mnemonic)

    const skyekiwi = new SkyeKiwi.Driver(
      encryptionSchema,
      fileHandle,
      key,
      ipfs,
      blockchain
    )
    vaultId2 = await skyekiwi.upstream()

    await ipfs.stopIfRunning()
    await unlink(filePath)
  })

  it('downstream, two members + author', async () => {

    try {
      await unlink(downstreamPath)
    } catch (err) { }

    const ipfs = new SkyeKiwi.IPFS()

    // Author can decrypt
    // await SkyeKiwi.Driver.downstream(
    //   vaultId, blockchain, ipfs, mnemonic,
    //   downstreamPath, 
    //   [mnemonicToMiniSecret(mnemonic)]
    // )

    await SkyeKiwi.Driver.downstream(
      vaultId2, blockchain, ipfs,
      downstreamPath,
      [privateKey1, privateKey2]
    )

    const downstreamContent = fs.readFileSync(downstreamPath)
    expect(Buffer.compare(downstreamContent, content)).to.equal(0)

    await ipfs.stopIfRunning()
    await unlink(downstreamPath)
  })

  // `vaultId1` is a vault with only the author can read
  it('update encryptionSchema & downstream again', async () => {
    const mnemonic = process.env.SEED_PHRASE
    try {
      await unlink(downstreamPath)
    } catch(err){}

    const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(
      mnemonicToMiniSecret(mnemonic)
    )

    const ipfs = new SkyeKiwi.IPFS()

    // updated encryptionSchema

    // Author can decrypt
    // two members can decrypt together but not by themselves
    const encryptionSchema = new SkyeKiwi.EncryptionSchema(
      5, 3, author, 1
    )
    encryptionSchema.addMember(author, 2)
    encryptionSchema.addMember(publicKey1, 1)
    encryptionSchema.addMember(publicKey2, 1)    

    await SkyeKiwi.Driver.updateEncryptionSchema(
      vaultId1, encryptionSchema, mnemonic,
      [mnemonicToMiniSecret(mnemonic)], ipfs, blockchain
    )

    await SkyeKiwi.Driver.downstream(
      vaultId1, blockchain, ipfs,
      downstreamPath,
      [privateKey1, privateKey2]
    )

    const downstreamContent = fs.readFileSync(downstreamPath)
    expect(Buffer.compare(downstreamContent, content)).to.equal(0)

    await ipfs.stopIfRunning()
    await unlink(downstreamPath)
  })
})
