import * as SkyeKiwi from '../src/index'
import { mnemonicToMiniSecret } from '@polkadot/util-crypto'
import { expect } from 'chai'
import fs from 'fs'
import { randomBytes } from 'tweetnacl';

require('dotenv').config()

const { setup, downstreamPath, cleanup} = require('./setup.ts')

describe('Integration', function() {
  this.timeout(0)

  let vaultId1: number
  // let vaultId2: number
  const abi = SkyeKiwi.getAbi()
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
    // contract abi
    abi
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
      fileHandle[0].file,
      key,
      ipfs,
      blockchain
    )

    vaultId1 = await skyekiwi.upstream()

    await ipfs.stopIfRunning()
  })

  it('downstream, author only', async () => {
    const ipfs = new SkyeKiwi.IPFS()

    await SkyeKiwi.Driver.downstream(
      vaultId1, blockchain, ipfs,
      downstreamPath(0), [mnemonicToMiniSecret(mnemonic)]
    )

    const downstreamContent = fs.readFileSync(downstreamPath(0))
    expect(Buffer.compare(
      downstreamContent, 
      Buffer.from(fileHandle[0].content)
    )).to.equal(0)
    
    await ipfs.stopIfRunning()
  })

  const privateKey1 = randomBytes(32)
  const privateKey2 = randomBytes(32)

  const publicKey1 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey1)
  const publicKey2 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey2)

  // it('upstream, two members + author', async () => {
  //   const mnemonic = process.env.SEED_PHRASE
  //   const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(
  //     mnemonicToMiniSecret(mnemonic)
  //   )

  //   const ipfs = new SkyeKiwi.IPFS()

  //   // Author can decrypt
  //   // two members can decrypt together but not by themselves
  //   const encryptionSchema = new SkyeKiwi.EncryptionSchema(
  //     5, 3, author, 1
  //   )
  //   encryptionSchema.addMember(author, 2)
  //   encryptionSchema.addMember(publicKey1, 1)
  //   encryptionSchema.addMember(publicKey2, 1)

  //   const key = new SkyeKiwi.Seal(encryptionSchema, mnemonic)

  //   const skyekiwi = new SkyeKiwi.Driver(
  //     encryptionSchema,
  //     fileHandle[1].file,
  //     key,
  //     ipfs,
  //     blockchain
  //   )
  //   vaultId2 = await skyekiwi.upstream()

  //   await ipfs.stopIfRunning()
  // })

  // it('downstream, two members + author', async () => {
  //   const ipfs = new SkyeKiwi.IPFS()

  //   // Author can decrypt
  //   // await SkyeKiwi.Driver.downstream(
  //   //   vaultId, blockchain, ipfs, mnemonic,
  //   //   downstreamPath, 
  //   //   [mnemonicToMiniSecret(mnemonic)]
  //   // )

  //   await SkyeKiwi.Driver.downstream(
  //     vaultId2, blockchain, ipfs,
  //     downstreamPath(1),
  //     [privateKey1, privateKey2]
  //   )

  //   const downstreamContent = fs.readFileSync(downstreamPath(1))
  //   expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[1].content))).to.equal(0)

  //   await ipfs.stopIfRunning()
  // })

  // `vaultId1` is a vault with only the author can read
  it('update encryptionSchema & downstream again', async () => {
    const mnemonic = process.env.SEED_PHRASE
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

    console.log("UPGRADING DONE")

    await SkyeKiwi.Driver.downstream(
      vaultId1, blockchain, new SkyeKiwi.IPFS(),
      downstreamPath(3),
      [privateKey1, privateKey2]
    )

    const downstreamContent = fs.readFileSync(downstreamPath(3))
    expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[0].content))).to.equal(0)

    await ipfs.stopIfRunning()
  })
})
