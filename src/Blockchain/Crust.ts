import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import {sendTx} from './index'

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
  public async placeBatchOrderWithCIDList(cidList: [{cid: string, size: number}], tip?: number) {

    let extrinsicQueue = []
    for (let cid of cidList) {
      extrinsicQueue.push(this.api.tx.market.placeStorageOrder(
        cid.cid, cid.size, tip ? tip : 0
      ))
    }
    const crustResult = await sendTx(
      this.api.tx.utility.batchAll(
        extrinsicQueue
      ), this.signer
    )
    return crustResult
  }

  public async awaitNetworkFetching(cidList: [{ cid: string, size: number }]) {
    let cidQueue = []
    for (let cid of cidList) {
      cidQueue.push(cid.cid) 
    }

    while (cidQueue.length != 0) {
      // console.log(cidQueue)
      const result = []
      for (let i = 0; i < cidQueue.length; i ++) {
        const status = await this.api.query.market.files(cidQueue[i]);
        
        //@ts-ignore
        result.push(status && status.reported_replica_count != 0)
        console.log(status)
      }

      for (let i = 0; i < cidQueue.length; i ++) {
        if (result[i]) cidQueue[i] = ""
      }

      cidQueue = cidQueue.filter(cid => cid !== "")
      // cidQueue = cidQueue.filter(async cid => {
      //   const status = await this.api.query.market.files(cid);
      //   console.log(status)
        
      //   return status && status.reported_replica_count != 0
      // })
    }
  }

  // size in term of bytes
  public async getStoragePrice(size: number) {
    const unitPricePerMB = await this.api.query.market.filePrice()
    const price = parseInt(unitPricePerMB.toHex())
    return  price * size / 1024
  }
}
