// Copyright 2021 - 2022 @skyekiwi/crust-network authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer } from '@polkadot/api/types';
import type { IPFSResult } from '@skyekiwi/ipfs/types';

import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { waitReady } from '@polkadot/wasm-crypto';

import { getLogger, sendTx } from '@skyekiwi/util';

export class Crust {
  #sender: string | KeyringPair
  #signer: Signer | undefined
  #api: ApiPromise
  #provider: WsProvider
  #mnemonic: string

  /**
   * Constructor for a Crust Network connector
   * @constructor
   * @param {string} sender either a **seed phrase** or an **address**
   * @param {Signer} signer when sender is an **address**, pass in a Signer
   * @param {boolean} [testnet = true] whether or not to send the tx on testnet, True by default
  */
  constructor (sender: string, signer?: Signer, testnet = true) {
    const logger = getLogger('Crust.constructor');

    this.#provider = testnet ? new WsProvider('wss://rpc-rocky.crust.network/') : new WsProvider('wss://rpc.crust.network/');
    this.#api = new ApiPromise({
      provider: this.#provider,
      typesBundle: typesBundleForPolkadot
    });

    if (mnemonicValidate(sender)) {
      this.#mnemonic = sender;
    } else {
      logger.info('mnemonic validation failed, trying to init in browser mode');

      if (signer === undefined) {
        throw new Error('initialization failed, a Signer is needed - Crust.Contrusctor');
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
    if (this.#mnemonic) {
      await waitReady();
      const keypair = (new Keyring({
        type: 'sr25519'
      })).addFromUri(this.#mnemonic);

      this.#sender = keypair;
      this.#signer = undefined;

      return true;
    } else {
      if (this.#sender && this.#signer) {
        return true;
      } else {
        throw new Error('Init failed, this should never happen - Crust.init');
      }
    }
  }

  /**
    * place one Crust Network storage order
    * @param {string} cid the CID to the IPFS content to be stored
    * @param {number} size size of the content - must NOT be lower than the IPFS size or the network will reject the file
    * @param {number} tip optional tip for faster processing
    * @returns {Promise<boolean>} whether the tx goes through fine
  */
  public async placeOrder (cid: string, size: number, tip?: number): Promise<boolean> {
    return await sendTx(
      this.#api.tx.market.placeStorageOrder(
        cid, size, tip || 0, 'test'
      ),
      this.#sender, this.#signer
    );
  }

  /**
    * place a batch of Crust Network storage orders
    * @param {IPFSResult[]} cidList a list of IPFSResults to be stored
    * @param {number} tip optional tip for faster processing
    * @returns {Promise<boolean>} whether the tx goes through fine
  */
  public async placeBatchOrderWithCIDList (cidList: IPFSResult[], tip?: number): Promise<boolean> {
    const extrinsicQueue = [];

    for (const cid of cidList) {
      extrinsicQueue.push(this.#api.tx.market.placeStorageOrder(
        cid.cid, cid.size, tip || 0, 'test'
      ));
    }

    const crustResult = await sendTx(
      this.#api.tx.utility.batchAll(
        extrinsicQueue
      ), this.#sender, this.#signer
    );

    return crustResult;
  }

  /**
    * query the Crust Network storage price
    * @param {number} size size of the file to be stored in BYTES
    * @returns {Promise<number>} a promise of the price
  */
  public async getStoragePrice (size: number): Promise<number> {
    const unitPricePerMB = await this.#api.query.market.filePrice();
    const price = parseInt(unitPricePerMB.toHex());

    return price * size / 1024;
  }
}
