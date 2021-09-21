// Copyright 2021 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0
import type { Signer } from '@polkadot/api/types';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { AnyJson, RegistryTypes } from '@polkadot/types/types';
import { waitReady } from '@polkadot/wasm-crypto';
import { mnemonicValidate } from '@polkadot/util-crypto'

import { sendTx } from '@skyekiwi/util';

export class WASMContract {
  public api: ApiPromise

  #abi: AnyJson
  #address: string
  #contract: ContractPromise
  #provider: WsProvider

  #sender: string | KeyringPair
  #mnemonic: string
  #signer: Signer | undefined

  constructor (
    sender: string,
    types: AnyJson,
    abi: AnyJson,
    contractAddress: string,
    signer?: Signer,
    testnet = true
  ) {
    this.#abi = abi;
    this.#address = contractAddress;
    this.#provider = testnet ? new WsProvider('wss://ws.jupiter-poa.patract.cn') : new WsProvider('wss://ws.jupiter-poa.patract.cn');
    this.api = new ApiPromise({
      provider: this.#provider,
      types: types as RegistryTypes
    });

    if (mnemonicValidate(sender)) {
      this.#mnemonic = sender;
    } else {
      if (signer === undefined) {
        throw new Error('initialization failed, a Signer is needed - Crust.Contrusctor')
      } else {
        this.#sender = sender;
        this.#signer = signer;
      }
    }
  }

  public async disconnect (): Promise<void> {
    await this.#provider.disconnect();
  }

  public async init (): Promise<boolean> {
    await waitReady();
    this.api = await this.api.isReadyOrError;

    if (this.#mnemonic) {
      const keypair = (new Keyring({
        type: 'sr25519'
      })).addFromUri(this.#mnemonic)

      this.#sender = keypair;
      this.#signer = undefined;
      this.#contract = new ContractPromise(
        this.api, new Abi(this.#abi, this.api.registry.getChainProperties()), this.#address
      );

      return true;
    } else {
      if (this.#sender && this.#signer) {
        this.#contract = new ContractPromise(
          this.api, new Abi(this.#abi, this.api.registry.getChainProperties()), this.#address
        );
        return true;
      } else {
        throw new Error('Init failed, this should never happen - Crust.init')
      }
    }
  }

  async execContract (message: string, params: unknown[]): Promise<AnyJson> {
    // "the dirty method" as in https://github.com/patractlabs/redspot/issues/78
    const execResult = await this.queryContract(message, params);

    const extrinsic = this.#contract.tx[message](
      { gasLimit: -1 },
      ...params
    );

    const txResult = await sendTx(extrinsic, this.#sender, this.#signer);

    if (txResult) {
      return execResult.output?.toJSON();
    } else return txResult;
  }

  async queryContract (message: string, params: unknown[]) {
    // eslint-disable-next-line
    return (await this.#contract.query[message](
      (typeof this.#sender === 'object') ? (this.#sender as KeyringPair).address : this.#sender,
      { gasLimit: -1 },
      ...params
    ));
  }
}
