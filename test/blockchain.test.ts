import * as SkyeKiwi from '../src/index'
import { expect } from 'chai';
import { randomBytes } from 'tweetnacl'

require('dotenv').config();

describe('Blockchain', function () {

  this.timeout(0)

  it('Blockchain: send contract tx & storage order works', async () => {
    const mnemonic = process.env.SEED_PHRASE
    const blockchain = new SkyeKiwi.Blockchain(
      mnemonic,
      '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg',
      'wss://ws.jupiter-poa.patract.cn',
      'wss://rocky-api.crust.network/',
    )

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
