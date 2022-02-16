// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { waitReady } from '@polkadot/wasm-crypto';

export class Chain {
    #provider: WsProvider
    #api: ApiPromise

    public async init (): Promise<void> {
      const seed = process.env.TEST_SEED_PHRASE;

      if (!seed) {
        throw new Error('seed phrase not found');
      }

      await waitReady();

      this.#provider = new WsProvider('ws://localhost:9944');
      // this.#provider = new WsProvider('wss://staging.rpc.skye.kiwi');
      this.#api = await ApiPromise.create({ provider: this.#provider });
    }

    public async subscribeNewBlock (
      newBlockHook: (blockNumber: number) => Promise<void>
      // newContractDeployHook: (contractIds: number[]) => void,
      // newCallsHook: (calls: string[]) => void
    ): Promise<void> {
      await this.#api.rpc.chain.subscribeNewHeads(async (latestHeader) => {
        // new block hook comes first
        await newBlockHook(latestHeader.number.toNumber());
        // await this.subscribeNewContractsDeployed(latestHeader.hash.toString(), newContractDeployHook);
        // await this.subscribeNewContractCallToShards(latestHeader.hash.toString(), newCallsHook);
      });
    }

  // private async subscribeNewContractsDeployed (blockHash: string, callback: (contractIds: number[]) => void) {

  // }

  // private async subscribeNewContractCallToShards (blockHash: string, callback: (calls: string[]) => void) {

  // }
}
