// Copyright 2021 - 2022 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer } from '@polkadot/api/types';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { AnyJson, RegistryTypes } from '@polkadot/types/types';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { waitReady } from '@polkadot/wasm-crypto';

import { getLogger, sendTx } from '@skyekiwi/util';

export class SecretRegistry {
  public api: ApiPromise
  public senderAddress: string

  #provider: WsProvider
  #sender: string | KeyringPair
  #mnemonic: string
  #signer: Signer | undefined

  /**
   * Constructor for a WASM Contract registry
   * @constructor
   * @param {string} sender either a **seed phrase** or an **address**
   * @param {AnyJson} types types defination of the Substrate based blockchain
   * @param {AnyJson} abi abi of the wasm contract
   * @param {string} contractAddress the address of the contract instace on chain
   * @param {Signer} [signer] optional signer when sender is an **address** and load in browser mode
   * @param {boolean} [testnet = true] whether or not to send the tx on testnet, True by default
  */
  constructor (
    sender: string,
    types: AnyJson,
    signer?: Signer,
    testnet = true
  ) {
    const logger = getLogger('SecretRegistry.constructor');

    this.#provider = testnet ? new WsProvider('wss://staging.rpc.skye.kiwi') : new WsProvider('wss://staging.rpc.skye.kiwi');
    // this.#provider = new WsProvider('ws://localhost:9944');
    this.api = new ApiPromise({
      provider: this.#provider,
      types: types as RegistryTypes
    });

    if (mnemonicValidate(sender)) {
      this.#mnemonic = sender;
    } else {
      logger.info('mnemonic validation failed, loading in browser mode');

      if (signer === undefined) {
        throw new Error('initialization failed, a Signer is needed - SecretRegistry.Contrusctor');
      } else {
        this.#sender = sender;
        this.#signer = signer;
      }
    }
  }

  /**
   * Disconnect rpc connections
  */
  public async disconnect (): Promise<void> {
    await this.#provider.disconnect();
  }

  /**
   * Initialize the connector. Must be run before sending tx
  */
  public async init (): Promise<boolean> {
    await waitReady();
    this.api = await this.api.isReadyOrError;

    if (this.#mnemonic) {
      const keypair = (new Keyring({
        type: 'sr25519'
      })).addFromUri(this.#mnemonic);

      this.senderAddress = keypair.address;
      this.#sender = keypair;
      this.#signer = undefined;

      return true;
    } else {
      if (this.#sender && this.#signer) {
        // here this.#sender is always an address string
        this.senderAddress = this.#sender as string;

        return true;
      } else {
        throw new Error('Init failed, this should never happen - SecretRegistry.init');
      }
    }
  }

  /**
   * register a secret
   * @param {string} message the name of the function of the contract to be called
   * @param {unknown[]} params paramters of the function call
   * @returns {Promise<AnyJson>} result from the blockchain
  */
  async registerSecret (metadata: String): Promise<number | null> {

    const extrinsic = this.api.tx.secrets.registerSecret(metadata);
    const txResult = await sendTx(extrinsic, this.#sender, this.#signer);

    if (txResult) {      
      // time to get the secretId of the newly registered secret

      const secretId = txResult.find(({ event: { method } }) => method === 'Registered').event.data[0];
      return Number(secretId);

    } else { return null; }
  }
}
