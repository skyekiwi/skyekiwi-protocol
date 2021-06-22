import * as SkyeKiwi from '../src/index'
import { expect } from 'chai';
import { randomBytes } from 'tweetnacl'

require('dotenv').config();

describe('Blockchain', function () {

  this.timeout(100000)

  const abi = SkyeKiwi.getAbi()

  // to run a local canvas blockchain ...
  // const { execSync } = require("child_process")
  // execSync('canvas --dev --tmp')

  it('Blockchain: send contract tx & storage order works', async () => {
    const mnemonic = process.env.SEED_PHRASE
    const blockchain = new SkyeKiwi.Blockchain(
      mnemonic,
      '3cNizgEgkjB8TKm8FGJD3mtcxNTwBRxWrCwa77rNTq3WaZsM',
      'wss://jupiter-poa.elara.patract.io',
      'wss://rocky-api.crust.network/',
      abi)

    await blockchain.init()

    const ipfs = new SkyeKiwi.IPFS()
    const storage = blockchain.storage
    const contract = blockchain.contract

    let content = []
    for (let i = 0; i < 3; i++) {
      content.push(await ipfs.add(
          SkyeKiwi.Util.u8aToHex(
            randomBytes(1000)
          )
        )
      )
    }

    //@ts-ignore
    const crustResult = await storage.placeBatchOrderWithCIDList(content)

    // await storage.awaitNetworkFetching(content)
    expect(crustResult).to.equal(true)

    const contractResult = await contract.execContract(
      'createVault', ['QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm'])
    expect(contractResult['ok']).to.be.a('number')

    await ipfs.stopIfRunning()
  })
})
