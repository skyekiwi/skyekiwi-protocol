// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {SContractQueue} from './queue'

export class SContractExecutor {
  
  #queue: SContractQueue

  constructor(queue: SContractQueue) {
    this.#queue = queue;
  }

  public async dispatch() {
    const calls = this.#queue.getDispatchableCalls();
    console.log(calls);
  }

}
