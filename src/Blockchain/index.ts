import {sendTx} from './sendTx'
import { Crust } from './Crust'
import { Contract } from './Contract'

import { ContractPromise } from '@polkadot/api-contract';
import { waitReady } from '@polkadot/wasm-crypto'
import { ApiPromise, WsProvider } from '@polkadot/api';
import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { Keyring } from '@polkadot/keyring';

export class Blockchain {

  public contract: Contract
  public storage: Crust
  public isReady: boolean

  constructor(
    private seed: string,
    private contract_address: string,
    private contract_endpoint: string,
    private crust_endpoint: string,
    private contract_abi: {},
    private types?: any
  ) {
    this.isReady = false
    this.types = types ? types : {
      "LookupSource": "MultiAddress",
      "Address": "MultiAddress",
      "FullIdentification": "AccountId",
      "AuthorityState": {
        "_enum": [
          "Working",
          "Waiting"
        ]
      },
      "EraIndex": "u32",
      "ActiveEraInfo": {
        "index": "EraIndex",
        "start": "Option<u64>"
      },
      "UnappliedSlash": {
        "validator": "AccountId",
        "reporters": "Vec<AccountId>"
      }, Error: {
        _enum: ['VaultIdError', 'AccessDenied', 'MetadataNotValid', 'MathError']
      },
    }
  }

  public async init() {
    if (this.isReady) return

    await waitReady()

    const keyring = (new Keyring({
      type: 'sr25519',
    })).addFromUri(this.seed);


    let crust_api = new ApiPromise({
      provider: new WsProvider(this.crust_endpoint),
      typesBundle: typesBundleForPolkadot,
    });
    crust_api = await crust_api.isReadyOrError;
    
    let contract_api = new ApiPromise({
      provider: new WsProvider(this.contract_endpoint),
      types: this.types,
    });
    contract_api = await contract_api.isReadyOrError;

    let contract_instance = new ContractPromise(
      contract_api, 
      this.contract_abi, 
      this.contract_address
    );

    this.contract = new Contract(
      keyring, contract_instance
    )

    this.storage = new Crust(
      keyring, crust_api
    )
    
    this.isReady = true
  }
}



export {
  sendTx, Crust, Contract
}
