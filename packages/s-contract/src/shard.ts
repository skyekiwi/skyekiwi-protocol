// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { waitReady } from '@polkadot/wasm-crypto';
import { randomBytes } from 'tweetnacl';

import { AsymmetricEncryption } from '@skyekiwi/crypto';
import { sendTx, u8aToHex } from '@skyekiwi/util';

export class ShardManager {
    #provider: WsProvider
    #keyring: KeyringPair
    #api: ApiPromise

    #key: Uint8Array
    #shards: number[]

    #shardMembers: { [shard: number]: string[] }
    #beaconIndex: { [shard: number]: number }
    #threshold: { [shard: number]: number }

    constructor (runningShards: number[], key?: Uint8Array) {
      this.#shards = runningShards;
      this.#key = key || randomBytes(32);

      this.#shardMembers = {};
      this.#beaconIndex = {};
      this.#threshold = {};
    }

    public async init (): Promise<void> {
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

    public async disconnect (): Promise<void> {
      await this.#provider.disconnect();
    }

    public async maybeRegisterSecretKeeper (blockNumber: number): Promise<void> {
      const allExtrinsics = [];

      const maybeExpiration = await this.#api.query.registry.expiration(this.#keyring.address);
      const expiration = Number(maybeExpiration.toString());

      if (isNaN(expiration) || expiration - 10 < blockNumber) {
        // not previously registered
        allExtrinsics.push(this.#api.tx.registry.registerSecretKeeper(
          u8aToHex(AsymmetricEncryption.getPublicKey(this.#key)),
          '0x0000'
        ));

        for (const shard of this.#shards) {
          allExtrinsics.push(this.#api.tx.registry.registerRunningShard(shard));
        }

        const all = this.#api.tx.utility.batch(allExtrinsics);

        await sendTx(all, this.#keyring);
      }
    }

    public maybeSubmitExecutionReport (blockNumber: number): void {
      for (const shard of this.#shards) {
        console.log(this.beaconIsTurn(blockNumber, shard));

        if (this.beaconIsTurn(blockNumber, shard)) {
          console.log('Submitting Tx');
        }
      }
    }

    public async fetchShardInfo (): Promise<void> {
      for (const shard of this.#shards) {
        const maybeMembers = await this.#api.query.registry.shardMembers(shard);
        const maybeBeaconIndex = await this.#api.query.registry.beaconIndex(shard, this.#keyring.address);
        const maybeThreshold = await this.#api.query.parentchain.shardConfirmationThreshold(shard);

        const members = maybeMembers.toJSON();
        const beaconIndex = Number(maybeBeaconIndex.toString());
        const threshold = Number(maybeThreshold.toString());

        if (members) {
          this.#shardMembers[shard] = members as string[];
        }

        if (beaconIndex) {
          this.#beaconIndex[shard] = beaconIndex;
        }

        this.#threshold[shard] = threshold || threshold === 0 ? 1 : threshold;
      }
    }

    private beaconIsTurn (
      blockNumber: number, shard: number
    ): boolean {
      const beaconIndex = this.#beaconIndex[shard];
      const threshold = this.#threshold[shard];
      const beaconCount = this.#shardMembers[shard].length;

      console.log(beaconIndex, threshold, beaconCount);

      // 1 2 3 4 5 6 7 8 9
      return threshold >= beaconCount ||
        (
      // _ X X X _ _ _ _ _
          blockNumber % beaconCount <= beaconIndex &&
            beaconIndex <= blockNumber % beaconCount + threshold - 1
        ) ||
        (
      // X X _ _ _ _ _ _ X
          blockNumber % beaconCount + threshold - 1 > beaconCount &&
            (
              beaconCount - (blockNumber % beaconCount + threshold - 1) % beaconCount <= beaconIndex ||
                beaconIndex <= blockNumber % beaconCount + threshold - 1 - beaconCount
            )
        );
    }
}
