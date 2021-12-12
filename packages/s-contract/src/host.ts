// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call, InitializeContractCall } from './types';

import { SContractAPIs, SContract } from '@skyekiwi/s-contract'
import { MockBlockchainEnv } from './blockchain';

import { Queue } from './queue';
import { Executor } from './executor'
import configuration from './config';

const contractId = '0x0001b4';

export class SContractHost {

  #instances: { [key: string]: SContract };
  #queue: { [key: string]: Queue };
  #executor: Executor

  constructor() {
    this.#instances = {}
    this.#queue = {}
    this.#executor = new Executor();
  }

  public mainLoop(): void {
    const mock = new MockBlockchainEnv();
    mock.spawnBlocks(this.subscriber);
    mock.spawnNewContractReq(this.initializeNewContract, contractId);
  }

  public async initializeNewContract(call: InitializeContractCall): Promise<void> {
    const latestCallIndex = call.latestCallIndex;
    const instance = await SContractAPIs.initialize(
      configuration, call.contractId, 'QmfRE8M9X3iiJzvVrsHUyDrYywsspgRCqVj9CNS3sqspqx')

    this.#instances[call.contractId] = instance;
    this.#queue[call.contractId].setRemoteCallIndex(latestCallIndex);
  }


  public async subscriber(calls: Call[]): Promise<void> {
    for (const call of calls) {
      const currentContractId = call.contractId;
      if (!this.#instances[currentContractId]) {
        console.log("local contract not initialized!");
        // pass
      }
      this.#queue[currentContractId].newCall(call);
    }
  }

  public async executeOne(contractId: string) {
    const queue = this.#queue[contractId].getQueue();
    await this.#executor.
  }
}
