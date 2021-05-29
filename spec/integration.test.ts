import * as SkyeKiwi from '../src/index'
import { mnemonicToMiniSecret } from '@polkadot/util-crypto'
import path from 'path'
require('dotenv').config();

import fs from 'fs'
import {expect} from 'chai'
import { randomBytes } from 'tweetnacl';
const filePath = path.join(__dirname, '/tmp/tmp.file')
const downstreamPath = path.join(__dirname, '/tmp/tmp.down')

const content = randomBytes(12000000)

const setup = async () => {
  // we are creating two files here:
  // tmp.file - a 12MB file of random bytes
  await SkyeKiwi.Util.writeFile(Buffer.from(content), filePath)

  // SkyeKiwi.File has a default chunk size of 100MB.
  // we are making it 0.1MB here to demostrate it works
  const file = new SkyeKiwi.File(
    filePath,
    'tmp.file',
    'a testing file with 119MB repeating 187 byte',
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
  this.timeout(1000000)

  let vaultId1: number
  let vaultId2: number

  it('upstream: testnet, author only', async () => {
    const fileHandle = await setup()

    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(
      mnemonicToMiniSecret(mnemonic)
    )

    const ipfs_config = new SkyeKiwi.IPFSConfig(
      'ipfs.infura.io', 5001, 'https'
    )
    const ipfs = new SkyeKiwi.IPFS(ipfs_config)

    const encryptionSchema = new SkyeKiwi.EncryptionSchema(
      2, 2, author, 1
    )
    encryptionSchema.addMember(author, 1)
    
    const key = new SkyeKiwi.Seal(encryptionSchema, mnemonic)
    const skyekiwi = new SkyeKiwi.Driver(
      encryptionSchema,
      fileHandle,
      key,
      ipfs
    )

    vaultId1 = await skyekiwi.upstream()
    await unlink(filePath)
  })

  it('downstream: testnet, author only', async () => {

    const abi = require('../contract/artifacts/skyekiwi.json')
    const mnemonic = process.env.SEED_PHRASE
    const blockchain = new SkyeKiwi.Blockchain(
      // seed phrase
      mnemonic,
      // contract address
      '3hBx1oKmeK3YzCxkiFh6Le2tJXBYgg6pRhT7VGVL4yaNiERF',
      // contract instance endpoint
      'wss://jupiter-poa.elara.patract.io',
      // storage network endpoint
      'wss://rocky-api.crust.network/',
      // contract abi
      abi
    )

    const ipfs_config = new SkyeKiwi.IPFSConfig(
      'ipfs.infura.io', 5001, 'https'
    )
    const ipfs = new SkyeKiwi.IPFS(ipfs_config)

    await SkyeKiwi.Driver.downstream(
      vaultId1, blockchain, ipfs,
      downstreamPath, [mnemonicToMiniSecret(mnemonic)]
    )

    const downstreamContent = fs.readFileSync(downstreamPath)
    expect(Buffer.compare(downstreamContent, content)).to.equal(0)
    await unlink(downstreamPath)
  })

  const privateKey1 = randomBytes(32)
  const privateKey2 = randomBytes(32)

  const publicKey1 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey1)
  const publicKey2 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey2)

  it('upstream: testnet, two members + author', async () => {
    const fileHandle = await setup()

    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(
      mnemonicToMiniSecret(mnemonic)
    )

    const ipfs_config = new SkyeKiwi.IPFSConfig(
      'ipfs.infura.io', 5001, 'https'
    )
    const ipfs = new SkyeKiwi.IPFS(ipfs_config)

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
      ipfs
    )

    vaultId2 = await skyekiwi.upstream()
    await unlink(filePath)
  })

  it('downstream: testnet, two members + author', async () => {

    const abi = require('../contract/artifacts/skyekiwi.json')
    const mnemonic = process.env.SEED_PHRASE
    const blockchain = new SkyeKiwi.Blockchain(
      // seed phrase
      mnemonic,
      // contract address
      '3hBx1oKmeK3YzCxkiFh6Le2tJXBYgg6pRhT7VGVL4yaNiERF',
      // contract instance endpoint
      'wss://jupiter-poa.elara.patract.io',
      // storage network endpoint
      'wss://rocky-api.crust.network/',
      // contract abi
      abi
    )

    const ipfs_config = new SkyeKiwi.IPFSConfig(
      'ipfs.infura.io', 5001, 'https'
    )
    const ipfs = new SkyeKiwi.IPFS(ipfs_config)

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
    await unlink(downstreamPath)
  })

  // `vaultId1` is a vault with only the author can read
  it('update encryptionSchema & downstream again', async () => {
    const mnemonic = process.env.SEED_PHRASE
    const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(
      mnemonicToMiniSecret(mnemonic)
    )

    const abi = require('../contract/artifacts/skyekiwi.json')
    const blockchain = new SkyeKiwi.Blockchain(
      // seed phrase
      mnemonic,
      // contract address
      '3hBx1oKmeK3YzCxkiFh6Le2tJXBYgg6pRhT7VGVL4yaNiERF',
      // contract instance endpoint
      'wss://jupiter-poa.elara.patract.io',
      // storage network endpoint
      'wss://rocky-api.crust.network/',
      // contract abi
      abi
    )

    const ipfs_config = new SkyeKiwi.IPFSConfig(
      'ipfs.infura.io', 5001, 'https'
    )
    const ipfs = new SkyeKiwi.IPFS(ipfs_config)


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
    console.log(downstreamContent.length)
    expect(Buffer.compare(downstreamContent, content)).to.equal(0)
    await unlink(downstreamPath)
  })
})
