// Copyright 2021 @skyekiwi/crust-network authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IPFSResult } from '@skyekiwi/ipfs/types';

import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { waitReady } from '@polkadot/wasm-crypto';

import { sendTx } from '@skyekiwi/util';

export class Crust {
  #signer: string | KeyringPair
  #api: ApiPromise
  #isReady: boolean

  constructor (signer: string | KeyringPair, testnet = true) {
    this.#signer = signer;
    this.#isReady = false;

    if (testnet) {
      this.#api = new ApiPromise({
        provider: new WsProvider('wss://rpc-rocky.crust.network/'),
        typesBundle: typesBundleForPolkadot
      });
    } else {
      this.#api = new ApiPromise({
        provider: new WsProvider('wss://rpc.crust.network/'),
        typesBundle: typesBundleForPolkadot
      });
    }
  }

  public async init (): Promise<boolean> {
    try {
      await waitReady();

      if (typeof this.#signer === 'string') {
        this.#signer = (new Keyring({
          type: 'sr25519'
        })).addFromUri(this.#signer);
      }

      this.#api = await this.#api.isReadyOrError;
      this.#isReady = true;

      return true;
    } catch (err) {
      console.error(err);

      return false;
    }
  }

  public async placeOrder (cid: string, size: number, tip?: number): Promise<boolean> {
    if (this.#isReady === false) {
      throw new Error('initialization error, run .init() first - Crust.placeOrder');
    }

    return await sendTx(
      this.#api.tx.market.placeStorageOrder(
        cid, size, tip || 0, 'test'
      ),
      this.#signer as KeyringPair
    );
  }

  public async placeBatchOrderWithCIDList (cidList: IPFSResult[], tip?: number): Promise<boolean> {
    if (this.#isReady === false) {
      throw new Error('initialization error, run .init() first - Crust.placeBatchOrderWithCIDList');
    }

    const extrinsicQueue = [];

    for (const cid of cidList) {
      extrinsicQueue.push(this.#api.tx.market.placeStorageOrder(
        cid.cid, cid.size, tip || 0, 'test'
      ));
    }

    const crustResult = await sendTx(
      this.#api.tx.utility.batchAll(
        extrinsicQueue
      ), this.#signer as KeyringPair
    );

    return crustResult;
  }

  // size in term of bytes
  public async getStoragePrice (size: number): Promise<number> {
    if (this.#isReady === false) {
      throw new Error('initialization error, run .init() first - Crust.getStoragePrice');
    }

    const unitPricePerMB = await this.#api.query.market.filePrice();
    const price = parseInt(unitPricePerMB.toHex());

    return price * size / 1024;
  }
}
