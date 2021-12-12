// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { InitializeContractCall } from './types';
import type { Call, SContract } from '@skyekiwi/s-contract/types';

import { stringToIndex } from '@skyekiwi/util'

export class Queue {

  // latest synced call of local instances
  #local: number

  // latest call index of remote calls
  #remote: number

  #calls: Call[]

  #instance: SContract

  constructor(sContract: SContract) {
    this.#instance = sContract;
    this.#local = sContract.lastSyncedCallIndex;
  }

  public intiailize()

  public setRemoteCallIndex(callIndex: string) {
    this.#remote = stringToIndex(callIndex)
  }

  public newCall(call: Call) {
    this.#calls.push(call)
  }
}
