// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call } from './types';

import { SContract } from './scontract'
import { stringToIndex } from '@skyekiwi/util'

export class SContractQueue {

  // latest synced call of local instances
  #local: number
  // latest call index of remote calls
  #remote: number
  
  #callsCache: {[key: number]: Call}

  constructor(sContract: SContract, highRemoteCallIndex: string) {
    this.#local = stringToIndex(sContract.getHighLocalCallIndex());
    this.#remote = stringToIndex(highRemoteCallIndex);
  }

  public newCall(call: Call) {
    this.#callsCache[stringToIndex(call.callIndex)] = call;
  }

  public resolveCall(call: Call) {
    delete this.#callsCache[stringToIndex(call.callIndex)]
  }

  public checkIntegirty(): boolean {
    if (this.#local < this.#remote) {
      return false;
    } else {
      // TODO: check if the queue is missing calls
      return true;
    }
  }

  public forceSetRemoteCallIndex(callIndex: string) {
    this.#remote = stringToIndex(callIndex)
  }

  public getDispatchableCalls(): Call[] {
    const calls = [];
    for (const call in this.#callsCache) {
      calls.push(this.#callsCache[call])
    }
    return calls;
  }
}
