import { ContractPromise } from '@polkadot/api-contract';
import { KeyringPair } from '@polkadot/keyring/types';
import {sendTx} from './index'

export class Contract {

  constructor(
    private signer: KeyringPair,
    private instance: ContractPromise
  ) {}

  async execContract(message: string, params) {
    // "the dirty method" as in https://github.com/patractlabs/redspot/issues/78
    const execResult = await this.queryContract(message, params)
    
    const extrinsic = await this.instance.tx[message](
      { gasLimit: -1 }, 
      ...params
    )

    const txResult = await sendTx(extrinsic, this.signer)
    if (txResult) {
      return execResult.output?.toJSON()
    } else return txResult
  }

  async queryContract(message, params) {
    // @ts-ignore
    return (await this.instance.query[message](
      this.signer.address, 
      { gasLimit: -1 }, 
      ...params
    ))
  }
}
