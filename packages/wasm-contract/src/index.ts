// Copyright 2021 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { AnyJson, RegistryTypes } from '@polkadot/types/types';
import { waitReady } from '@polkadot/wasm-crypto';

import { sendTx } from '@skyekiwi/util';

export class WASMContract {
  public api: ApiPromise

  #abi: AnyJson
  #address: string
  #contract: ContractPromise
  #isReady: boolean
  #provider: WsProvider
  #signer: string | KeyringPair

  constructor (
    signer: string | KeyringPair,
    types: AnyJson,
    abi: AnyJson,
    contractAddress: string,
    testnet = true
  ) {
    this.#abi = abi;
    this.#address = contractAddress;
    this.#isReady = false;
    this.#provider = testnet ? new WsProvider('wss://ws.jupiter-poa.patract.cn') : new WsProvider('wss://ws.jupiter-poa.patract.cn');
    this.#signer = signer;
    this.api = new ApiPromise({
      provider: this.#provider,
      types: types as RegistryTypes
    });
  }

  public async disconnect (): Promise<void> {
    await this.#provider.disconnect();
  }

  public async init (): Promise<boolean> {
    try {
      await waitReady();

      if (typeof this.#signer === 'string') {
        this.#signer = (new Keyring({
          type: 'sr25519'
        })).addFromUri(this.#signer);
      }

      this.api = await this.api.isReadyOrError;

      this.#contract = new ContractPromise(
        this.api, new Abi(this.#abi, this.api.registry.getChainProperties()), this.#address
      );

      this.#isReady = true;

      return true;
    } catch (err) {
      console.error(err);

      return false;
    }
  }

  async execContract (message: string, params: unknown[]) {
    if (this.#isReady === false) {
      throw new Error('initialization error, run .init() first - WASMContract.execContract');
    }

    // "the dirty method" as in https://github.com/patractlabs/redspot/issues/78
    const execResult = await this.queryContract(message, params);

    const extrinsic = this.#contract.tx[message](
      { gasLimit: -1 },
      ...params
    );

    const txResult = await sendTx(extrinsic, this.#signer as KeyringPair);

    if (txResult) {
      return execResult.output?.toJSON();
    } else return txResult;
  }

  async queryContract (message: string, params: unknown[]) {
    if (this.#isReady === false) {
      throw new Error('initialization error, run .init() first - WASMContract.queryContract');
    }

    // eslint-disable-next-line
    return (await this.#contract.query[message](
      (this.#signer as KeyringPair).address,
      { gasLimit: -1 },
      ...params
    ));
  }
}
