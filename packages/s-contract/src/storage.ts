// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import fs from 'fs';

import { SymmetricEncryption } from '@skyekiwi/crypto';
import { IPFS } from '@skyekiwi/ipfs';
import { hexToU8a, stringToU8a, u8aToString } from '@skyekiwi/util';

import { Call, Outcome } from './borsh';
// import {Driver} from '@skyekiwi/driver';

class CallInfo {
  public rawOutcome: Outcome | undefined

  constructor (public rawCall: Call,
    public isArchive: boolean,
    public isEncrypted: boolean,
    public origin: string,
    public originPublicKey: string,
    public contractIndex: number
  ) {
    this.rawOutcome = undefined;
  }

  public writeOutcome (outcome: Outcome) {
    this.rawOutcome = outcome;
  }
}

class ContractInfo {
  public wasmBlob: Uint8Array
  public homeShard: number
  public metadataCID: string
  public metadata: Uint8Array
  public isInitialStateDecrypted: boolean

  constructor (public contractIndex: number) {
    this.isInitialStateDecrypted = false;
  }

  public async init (api: ApiPromise) {
    const ipfs = new IPFS();

    try {
      this.homeShard = Number((await api.query.secrets.homeShard(this.contractIndex)).toString());

      const wasmCID = (await api.query.secrets.wasmBlob(this.contractIndex)).toString();
      const content = await ipfs.cat(wasmCID);

      this.wasmBlob = hexToU8a(content);

      this.metadataCID = (await api.query.secrets.metadata(this.contractIndex)).toString();

      if (this.metadataCID !== '0000000000000000000000000000000000000000000000') {
        // the contract has no private initial state
        this.isInitialStateDecrypted = true;
      }
    } catch (e) {
      console.log(e);
    }
  }
}

class ShardInfo {
  public calls: number[]

  public highRemoteCallIndex: number
  public highLocalCallIndex: number
  public highRemoteSyncedBlockIndex: number
  public highRemoteConfirmedBlockIndex: number

  public confirmationThreshold: number
  constructor (public shardId: number) {
    this.calls = [];
    this.highRemoteCallIndex = 0;
    this.highLocalCallIndex = 0;
    this.highRemoteSyncedBlockIndex = 0;
    this.highRemoteConfirmedBlockIndex = 0;
    this.confirmationThreshold = 0;
  }

  public async init (api: ApiPromise) {
    const calls = (await api.query.sContract.callHistory(this.shardId)).toJSON();

    console.log(calls);
  }
}

export class Storage {
  public contracts: { [contractIndex: number]: ContractInfo }
  public calls: { [callIndex: number]: CallInfo }
  public shards: { [shardId: number]: ShardInfo }
  #key: Uint8Array

  constructor (public api: ApiPromise, key: Uint8Array, path?: string) {
    this.#key = key;

    if (path) {
      this.fromFile(path);
    } else {
      this.contracts = {};
      this.calls = {};
      this.shards = {};
    }
  }

  public fromFile (path: string): void {
    const source = fs.readFileSync(path);

    const decrypted = SymmetricEncryption.decrypt(source, this.#key);
    const obj = JSON.parse(u8aToString(decrypted)) as this;

    this.contracts = obj.contracts;
    this.calls = obj.calls;
    this.shards = obj.shards;
  }

  public saveToFile (path: string): void {
    const obj = stringToU8a(JSON.stringify(this));
    const encrypted = SymmetricEncryption.encrypt(obj, this.#key);

    fs.writeFileSync(path, encrypted);
  }
}
