// Copyright 2021 @skyekiwi/crust-network authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer } from '@polkadot/api/types';
import type { IPFSResult } from '@skyekiwi/ipfs/types';

import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { waitReady } from '@polkadot/wasm-crypto';

import { sendTx } from '@skyekiwi/util';

export class Crust {
  #sender: string | KeyringPair
  #signer: Signer | undefined
  #api: ApiPromise
  #provider: WsProvider
  #mnemonic: string

  constructor (sender: string, signer?: Signer, testnet = true) {
    this.#provider = testnet ? new WsProvider('wss://rpc-rocky.crust.network/') : new WsProvider('wss://rpc.crust.network/');
    this.#api = new ApiPromise({
      provider: this.#provider,
      typesBundle: typesBundleForPolkadot
    });

    if (mnemonicValidate(sender)) {
      this.#mnemonic = sender;
    } else {
      if (signer === undefined) {
        throw new Error('initialization failed, a Signer is needed - Crust.Contrusctor');
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

  public async placeOrder (cid: string, size: number, tip?: number): Promise<boolean> {
    return await sendTx(
      this.#api.tx.market.placeStorageOrder(
        cid, size, tip || 0, 'test'
      ),
      this.#sender, this.#signer
    );
  }

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

  // size in bytes
  public async getStoragePrice (size: number): Promise<number> {
    const unitPricePerMB = await this.#api.query.market.filePrice();
    const price = parseInt(unitPricePerMB.toHex());

    return price * size / 1024;
  }
}
