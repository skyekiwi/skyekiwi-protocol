// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';
import type { CallRecord } from './types';

import level from 'level';

import { IPFS } from '@skyekiwi/ipfs';
import { getLogger, hexToU8a, u8aToString } from '@skyekiwi/util';

import { ShardMetadata } from './borsh';
import { DBOps } from './types';
import { Block, Contract, LocalMetadata, Storage } from '.';

/* eslint-disable sort-keys, camelcase, @typescript-eslint/ban-ts-comment */
export class Indexer {
  #db: level.LevelDB
  #ops: DBOps[]

  public init (): void {
    this.#ops = [];
    this.#db = level('local');
  }

  public async initializeLocalMetadata () {
    const localMetadata = new LocalMetadata({
      shard_id: [0],
      high_remote_block: 0,
      high_local_block: 0
    });

    this.#ops.push(Storage.writeMetadata(localMetadata));
    await Storage.writeAll(this.#db, this.#ops);
    this.#ops = [];
  }

  public async fetchAll (api: ApiPromise): Promise<void> {
    const logger = getLogger('indexer.fetchAll');

    const localMetadata = await Storage.getMetadata(this.#db);
    const highLocalBlock = localMetadata.high_local_block ? localMetadata.high_local_block : 0;

    logger.info(`highest local block at ${localMetadata.high_local_block}`);

    let currentBlockNumber = highLocalBlock + 1;

    while (true) {
      logger.debug(`fetching all info from block# ${currentBlockNumber}`);

      for (const shardId of localMetadata.shard_id) {
        await this.fetchCalls(api, shardId, currentBlockNumber);
      }

      currentBlockNumber++;
      const currentHighBlockNumber = Number((await api.query.system.number()).toJSON());

      if (isNaN(currentHighBlockNumber) || currentBlockNumber >= currentHighBlockNumber) {
        logger.info(`all catchuped ... for now at block# ${currentHighBlockNumber}`);
        break;
      }
    }
  }

  public async fetchCalls (api: ApiPromise, shardId: number, blockNumber: number): Promise<void> {
    const logger = getLogger('indexer.fetchCalls');

    const calls = (await api.query.sContract.callHistory(shardId, blockNumber)).toJSON() as number[];

    // 1. build blocks
    const block = new Block({
      shard_id: shardId,
      block_number: blockNumber,
      calls: calls
    });

    this.#ops.push(Storage.writeBlockRecord(shardId, blockNumber, block));
    if (!calls) return;

    logger.info(`block import complete at block# ${blockNumber}`);

    // 2. build calls
    for (const call of calls) {
      const callContentRaw = (await api.query.sContract.callRecord(shardId, call)).toJSON();
      const callContent = callContentRaw as unknown as CallRecord;

      // logger.debug(callContent);
      console.log(callContent[0])
      console.log(callContent[1])

      // const callRecord = parseCall(callContent[0])
      // this.#ops.push(Storage.writeCallRecord(shardId, blockNumber, call, callRecord));
    }

    logger.info(`call import complete at block# ${blockNumber}`);

    // 3. build contracts
    const blockHash = ((await api.query.system.blockHash(blockNumber)).toJSON()) as string;
    const events = (await api.query.system.events.at(blockHash)).toHuman() as unknown as EventRecord[];

    events.map(async (evt) => {
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

    logger.info(`contract import complete at block# ${blockNumber}`);
  }

  public async fetchOnce (api: ApiPromise, address: string) {
    const localMetadata = await Storage.getMetadata(this.#db);

    for (const shard of localMetadata.shard_id) {
      const maybeMembers = await api.query.registry.shardMembers(shard);
      const maybeBeaconIndex = await api.query.registry.beaconIndex(shard, address);
      const maybeThreshold = await api.query.parentchain.shardConfirmationThreshold(shard);

      const members = maybeMembers.toJSON();
      const beaconIndex = Number(maybeBeaconIndex.toString());
      const threshold = Number(maybeThreshold.toString());

      let shardInfo;

      try {
        shardInfo = await Storage.getShardMetadataRecord(this.#db, shard);

        // shard has been recorded in the system
        // Updating ...
        shardInfo.shard_members = members as string[];
        shardInfo.beacon_index = beaconIndex;
        shardInfo.threshold = threshold || threshold === 0 ? 1 : threshold;
      } catch (e) {
        // shard has not been recorded in the system
        // Recording ...
        shardInfo = new ShardMetadata({
          shard_key: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
          shard_members: members as string[],
          beacon_index: beaconIndex,
          threshold: threshold
        });
      }

      this.#ops.push(Storage.writeShardMetadataRecord(shard, shardInfo));
    }
  }

  public async writeAll () {
    await Storage.writeAll(this.#db, this.#ops);
  }
}
