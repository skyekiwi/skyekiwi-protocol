// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { EventRecord } from '@polkadot/types/interfaces';

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
      newBlockHook: (blockNumber: number) => Promise<void>,
      newContractDeployHook: (contractIds: number[]) => void,
      newCallsHook: (calls: [{calls: string, origin: string}]) => void
    ): Promise<void> {
      await this.#api.rpc.chain.subscribeNewHeads(async (latestHeader) => {
        // new block hook comes first
        await newBlockHook(latestHeader.number.toNumber());
        await this.subscribeNewContractsDeployed(latestHeader.hash.toHex(), newContractDeployHook);
        await this.subscribeNewContractCallToShards(latestHeader.number.toNumber(), newCallsHook);
      });
    }

    private async subscribeNewContractsDeployed (blockHash: string, callback: (contractIds: number[]) => void) {
    // const contractIds = [];
      const events = (await this.#api.query.system.events.at('0xe7c186bff949d346a90c18b2afa130d293a40235270f2eef87254a8a80cf862f')).toHuman();

      (events as unknown as EventRecord[]).forEach((e) => {
        const evt = e.event;

        console.log(evt);
      // if (evt.section == "sContract" && evt.method == "deploy") {
      //   contractIds.push(e.data[0].toNumber());
      // }
      });

      callback([]);
    }

    private async subscribeNewContractCallToShards (blockNumber: number, callback: (calls: [{calls: string, origin: string}]) => void) {
      const calls = await this.#api.query.sContract.callHistory(0, blockNumber);

      callback(calls.toJSON() as [{calls: string, origin: string}]);
    }
}
