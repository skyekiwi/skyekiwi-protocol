// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { waitReady } from '@polkadot/wasm-crypto';

export class Dispatcher {
    #provider: WsProvider
    #keyring: KeyringPair
    #api: ApiPromise

    constructor () {}

    public async init () {
      const seed = process.env.TEST_SEED_PHRASE;

      if (!seed) {
        throw new Error('seed phrase not found');
      }

      await waitReady();

      this.#provider = new WsProvider('ws://localhost:9944');
      // this.#provider = new WsProvider('wss://staging.rpc.skye.kiwi');
      this.#api = await ApiPromise.create({ provider: this.#provider });

      this.#keyring = new Keyring({ type: 'sr25519' }).addFromUri(seed);
    }

    public async subscribeNewBlock (callback: (blockNumber: number) => void) {
      await this.#api.rpc.chain.subscribeNewHeads((latestHeader) => {
        callback(latestHeader.number.toNumber());
      });
    }

    public async subscribeShardMembers (callback: (members: string[]) => void) {

    }
}
