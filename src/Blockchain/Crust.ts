import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import {sendTx} from './index'
import IPFS from 'ipfs-core'

export class Crust {

  private signer: KeyringPair
  private api: ApiPromise

  constructor(signer: KeyringPair, api: ApiPromise) {
    this.signer = signer
    this.api = api
  }

  public async placeOrder(cid: string, size: number, tip?: number)
    : Promise<boolean> {
      await this.api.isReadyOrError;
      return await sendTx(
        this.api.tx.market.placeStorageOrder(
          cid, size, tip ? tip : 0
        ),
        this.signer
      )
  }

  public async placeBatchOrder(content: Uint8Array[], tip?: number) {
    const ipfs = await IPFS.create()

    let taskQueue: Promise<{cid: string, size: number}>[] = []
    for await (let chunk of content) {
      taskQueue.push(this.addFile(ipfs, chunk))
    }
    const results = await Promise.all(taskQueue)
    console.log(results)
    let extrinsicQueue = []
    for (let result of results) {
      extrinsicQueue.push(this.api.tx.market.placeStorageOrder(
        result.cid, result.size, tip?tip:0
      ))
    }

    const crustResult = await sendTx(
      this.api.tx.utility.batchAll(
        extrinsicQueue
      ), this.signer
    )

    return crustResult
  }

  // size in term of bytes
  public async getStoragePrice(size: number) {
    const unitPricePerMB = await this.api.query.market.filePrice()
    const price = parseInt(unitPricePerMB.toHex())
    return  price * size / 1024
  }

  private async addFile(ipfs: IPFS.IPFS, content: Uint8Array) {
    const cid = await ipfs.add(
      Buffer.from(content).toString('hex'),
      {
        progress: (prog: any) => console.log(`add received: ${prog}`)
      }
    );

    const fileStat = await ipfs.files.stat("/ipfs/" + cid.path)

    return {
      cid: cid.path, size: fileStat.cumulativeSize
    }
  }


}
