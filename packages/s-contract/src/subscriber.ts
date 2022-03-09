// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { EventRecord } from '@polkadot/types/interfaces';
import type { DBOps } from './types';

import { ApiPromise } from '@polkadot/api';

import { IPFS } from '@skyekiwi/ipfs';
import { hexToU8a, u8aToString } from '@skyekiwi/util';

import { Contract, Storage } from '.';

/* eslint-disable sort-keys, camelcase, @typescript-eslint/ban-ts-comment */
export class Subscriber {
    #ops: DBOps[]

    public init (): void {
      this.#ops = [];
    }

    public async subscribeNewBlock (
      api: ApiPromise,
      newBlockHook: (blockNumber: number) => Promise<void>,
      newContractDeployHook: (contractIds: number[]) => void,
      newCallsHook: (calls: [{calls: string, origin: string}]) => void
    ): Promise<void> {
      await api.rpc.chain.subscribeNewHeads(async (latestHeader) => {
        // new block hook comes first
        await newBlockHook(latestHeader.number.toNumber());
        await this.subscribeNewContractsDeployed(api, latestHeader.hash.toHex(), newContractDeployHook);
        await this.subscribeNewContractCallToShards(api, latestHeader.number.toNumber(), newCallsHook);
      });
    }

    private async subscribeNewContractsDeployed (
      api: ApiPromise, blockHash: string, callback: (contractIds: number[]) => void
    ): Promise<void> {
    // const contractIds = [];
      const events = (await api.query.system.events.at(blockHash)).toHuman();

      (events as unknown as EventRecord[]).map(async (evt) => {
        if (evt.event) {
          if (evt.event.method === 'SecretContractRegistered') {
            const secretId = Number(evt.event.data[0]);

            const homeShard = (await api.query.secrets.homeShard(secretId)).toJSON() as number;
            const wasmCIDRaw = (await api.query.secrets.wasmBlob(secretId)).toJSON() as string;
            const wasmCID = u8aToString(hexToU8a(wasmCIDRaw.substring(2)));

            console.log(wasmCID);
            const ipfs = new IPFS();
            const wasmBlob = hexToU8a(await ipfs.cat(wasmCID));

            const metadataCIDRaw = (await api.query.secrets.metadata(secretId)).toJSON() as string;
            const metadataCID = u8aToString(hexToU8a(metadataCIDRaw.substring(2)));

            if (metadataCID === '0000000000000000000000000000000000000000000000') {
              const metadata = hexToU8a(await ipfs.cat(metadataCID));
              const contract = new Contract({
                home_shard: homeShard,
                wasm_blob: wasmBlob,
                metadata_cid: metadataCID,
                metadata: metadata,
                is_initial_state_empty: false
              });

              this.#ops.push(Storage.writeContractRecord(secretId, contract));
            } else {
              const contract = new Contract({
                home_shard: homeShard,
                wasm_blob: wasmBlob,
                metadata_cid: metadataCID,
                metadata: null,
                is_initial_state_empty: true
              });

              this.#ops.push(Storage.writeContractRecord(secretId, contract));
            }
          }
        }
      });

      callback([]);
    }

    private async subscribeNewContractCallToShards (
      api: ApiPromise, blockNumber: number,
      callback: (calls: [{calls: string, origin: string}]) => void
    ): Promise<void> {
      const calls = await api.query.sContract.callHistory(0, blockNumber);

      callback(calls.toJSON() as [{calls: string, origin: string}]);
    }
}
