// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestDispatch, RequestInitializeContract, RequestRolldown } from './types';

import { getLogger } from '@skyekiwi/util';
import { spawn, Worker, Pool } from 'threads'

import { MockBlockchainEnv } from './blockchain';
const contractId = '0x0001b4';

// Host filter incoming calls and route accordingly
export class SContractHost {
  #instances: { [key: string]: any }
  #tasks: { [key: string]: any}

  constructor () {
    this.#instances = {};
    this.#tasks = {}
  }

  public mockMainLoop (blockNum: number): void {
    const logger = getLogger('SContractHost.mockMainLoop');

    const mock = new MockBlockchainEnv(blockNum);
    try {
      mock.spawnNewContractReq(this.subscribeInitializeContracts.bind(this), contractId);
      mock.spawnBlocks(this.subscribeDispatch.bind(this));
    } catch (err) {
      logger.error(err);
    }

    setInterval(async () => {
      for (const contractId in this.#tasks) {
        await Promise.all(this.#tasks[contractId]);
      }
    }, 6000)
  }

  public subscribeInitializeContracts (request: RequestInitializeContract): void {
    const logger = getLogger('SContractHost.subscribeInitializeContracts');
    const { contractId } = request;

    // 1. filter
    if (this.#instances.hasOwnProperty(contractId) && this.#tasks.hasOwnProperty(contractId)) {
      logger.info(`Request for initialize new contract ${contractId} receiverd, but the contract is already initialized. Passing`);
      // pass
    } else {
      const pool = Pool(() => spawn(new Worker('./worker')), 1);
      this.#tasks[contractId] = [];
      this.#instances[contractId] = pool;
      logger.info(`pushing the task to the tasks queue ${request} `)
      this.#tasks[contractId].push(pool.queue(async enclaveMock => {
        await enclaveMock.initialzeContract(request);
      }));
    }
  }

  public subscribeDispatch (request: RequestDispatch): void {
    const { calls } = request;
    const logger = getLogger('SContractHost.subscribeDispatch');

    for (const call of calls) {
      const currentContractId = call.contractId;

      if (!(this.#instances.hasOwnProperty(contractId) && this.#tasks.hasOwnProperty(contractId))) {
        logger.warn(`local contract ${currentContractId} not initialized!`);
        // pass
      } else {
        this.#tasks[currentContractId].push(
          // @ts-ignore
          this.#instances[currentContractId].queue(async enclaveMock => {
            await enclaveMock.dispatchCall(call);
          })
        )
      }
    }
  }

  public async subscribeRolldown (request: RequestRolldown): Promise<void> {
    const { contractId, highLocalCallIndex, highRemoteCallIndex } = request;
    const logger = getLogger('SContractHost.subscribeRolldown');

    logger.info(`should rolldown ${contractId}, from ${highLocalCallIndex} to ${highRemoteCallIndex}`);
  }
}
