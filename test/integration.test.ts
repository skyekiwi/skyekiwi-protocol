import * as SkyeKiwi from '../src/index'
import { mnemonicToMiniSecret } from '@polkadot/util-crypto'
import { expect } from 'chai'
import { randomBytes } from 'tweetnacl'
import fs from 'fs'

require('dotenv').config()

const { setup, downstreamPath, cleanup} = require('./setup')

describe('Integration', function() {
  this.timeout(0)

  let vaultId1: number
  let vaultId2: number
  const mnemonic = process.env.SEED_PHRASE

  const blockchain = new SkyeKiwi.Blockchain(
    // seed phrase
    mnemonic,
    // contract address
    '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg',
    // contract instance endpoint
    'wss://ws.jupiter-poa.patract.cn',
    // storage network endpoint
    'wss://rocky-api.crust.network/',
  )

  // generate 3 files
  let fileHandle
  before(async () => {
    fileHandle = await setup(3)
  })

  after(async () => {
    await cleanup()
  })

  it('upstream, author only', async () => {

    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.AsymmetricEncryption.getPublicKey(
      mnemonicToMiniSecret(mnemonic)
    )

    const encryptionSchema = new SkyeKiwi.EncryptionSchema({
      numOfShares: 2, 
      threshold: 2, 
      author: author, 
      unencryptedPieceCount: 1
    })
    encryptionSchema.addMember(author, 1)
    
    const key = new SkyeKiwi.Seal({
      encryptionSchema: encryptionSchema, 
      seed: mnemonic
    })

    vaultId1 = await SkyeKiwi.Driver.upstream({
      file: fileHandle[0].file,
      seal: key,
      blockchain: blockchain
    })
  })

  it('downstream, author only', async () => {
    const stream = fs.createWriteStream(downstreamPath(0), {flags: 'a'})
    await SkyeKiwi.Driver.downstream({
      vaultId: vaultId1,
      blockchain: blockchain,
      keys: [mnemonicToMiniSecret(mnemonic)],
      writeStream: stream,
    })

    const downstreamContent = fs.readFileSync(downstreamPath(0))
    expect(Buffer.compare(
      downstreamContent, 
      Buffer.from(fileHandle[0].content)
    )).to.equal(0)
  })

  const privateKey1 = randomBytes(32)
  const privateKey2 = randomBytes(32)
  const publicKey1 = SkyeKiwi.AsymmetricEncryption.getPublicKey(privateKey1)
  const publicKey2 = SkyeKiwi.AsymmetricEncryption.getPublicKey(privateKey2)

  it('upstream, two members + author', async () => {
    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.AsymmetricEncryption.getPublicKey(
      mnemonicToMiniSecret(mnemonic)
    )

    // Author can decrypt
    // two members can decrypt together but not by themselves
    const encryptionSchema = new SkyeKiwi.EncryptionSchema({
      numOfShares: 5,
      threshold: 3,
      author: author,
      unencryptedPieceCount: 1
    })

    encryptionSchema.addMember(author, 2)
    encryptionSchema.addMember(publicKey1, 1)
    encryptionSchema.addMember(publicKey2, 1)

    const key = new SkyeKiwi.Seal({
      encryptionSchema: encryptionSchema, 
      seed: mnemonic
    })

    vaultId2 = await SkyeKiwi.Driver.upstream({
      file: fileHandle[1].file,
      seal: key,
      blockchain: blockchain
    })
  })

  it('downstream, two members + author', async () => {
    // Author can decrypt
    // await SkyeKiwi.Driver.downstream(
    //   vaultId, blockchain, ipfs, mnemonic,
    //   downstreamPath, 
    //   [mnemonicToMiniSecret(mnemonic)]
    // )

    const stream = fs.createWriteStream(downstreamPath(1), {flags: 'a'})
    await SkyeKiwi.Driver.downstream({
      vaultId: vaultId2,
      blockchain: blockchain,
      keys: [privateKey1, privateKey2],
      writeStream: stream,
    })

    const downstreamContent = fs.readFileSync(downstreamPath(1))
    expect(Buffer.compare(
      downstreamContent,
      Buffer.from(fileHandle[1].content)
    )).to.equal(0)
  })

  // `vaultId1` is a vault with only the author can read
  it('update encryptionSchema & downstream again', async () => {
    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.AsymmetricEncryption.getPublicKey(
      mnemonicToMiniSecret(mnemonic)
    )

    // updated encryptionSchema

    // Author can decrypt
    // two members can decrypt together but not by themselves
    const encryptionSchema = new SkyeKiwi.EncryptionSchema({
      numOfShares: 5,
      threshold: 3,
      author: author,
      unencryptedPieceCount: 1
    })

    encryptionSchema.addMember(author, 2)
    encryptionSchema.addMember(publicKey1, 1)
    encryptionSchema.addMember(publicKey2, 1)

    await SkyeKiwi.Driver.updateEncryptionSchema({
      vaultId: vaultId1,
      newEncryptionSchema: encryptionSchema,
      seed: mnemonic,
      keys: [mnemonicToMiniSecret(mnemonic)],
      blockchain: blockchain
    })

    const stream = fs.createWriteStream(downstreamPath(3), {flags: 'a'})
    await SkyeKiwi.Driver.downstream({
      vaultId: vaultId1,
      blockchain: blockchain,
      keys: [privateKey1, privateKey2],
      writeStream: stream,
    })

    const downstreamContent = fs.readFileSync(downstreamPath(3))
    expect(Buffer.compare(
      downstreamContent,
      Buffer.from(fileHandle[0].content)
    )).to.equal(0)

  })
})
