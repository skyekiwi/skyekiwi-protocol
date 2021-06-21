import {sendTx} from './sendTx'
import { Crust } from './Crust'
import { Contract } from './Contract'
import { getAbi } from './getAbi'

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
    public seed: string,
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
      "AccountInfo": "AccountInfoWithTripleRefCount",
      "AliveContractInfo": {
        "trieId": "TrieId",
        "storageSize": "u32",
        "pairCount": "u32",
        "codeHash": "CodeHash",
        "rentAllowance": "Balance",
        "rentPayed": "Balance",
        "deductBlock": "BlockNumber",
        "lastWrite": "Option<BlockNumber>",
        "_reserved": "Option<Null>"
      },
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
      }, "Error": {
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
      // @ts-ignore
      contract_api, 
      this.contract_abi, 
      this.contract_address
    )

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
  sendTx, Crust, Contract, getAbi
}
