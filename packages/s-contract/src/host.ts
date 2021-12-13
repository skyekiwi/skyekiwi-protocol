// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestDispatch, RequestInitializeContract, RequestRolldown } from './types';

import { getLogger, stringToIndex } from '@skyekiwi/util';

import {SContract} from './scontract';
import { MockBlockchainEnv } from './blockchain';
import { SContractQueue } from './queue';
import { SContractPersistent } from './persistent'
import { SContractExecutor } from './executor';
import configuration from './config';

const contractId = '0x0001b4';

// Host filter incoming calls and route accordingly
export class SContractHost {

  #instances: { [key: string]: SContract };
  #queue: { [key: string]: SContractQueue };
  #executor: {[key: string]: SContractExecutor };

  constructor() {
    this.#instances = {}
    this.#queue = {}
    this.#executor = {}
  }

  public mockMainLoop(blockNum: number): void {
    const logger = getLogger(`SContractHost.mockMainLoop`);

    const mock = new MockBlockchainEnv(blockNum);

    logger.info(`one new contract request`)
    try {
      mock.spawnNewContractReq(this.subscribeInitializeContracts, contractId);
      // mock.spawnBlocks(this.subscribeDispatch);
    } catch(err) {
      logger.error(err)
    }
  }

  public async subscribeInitializeContracts(request: RequestInitializeContract): Promise<void> {
    const logger = getLogger("SContractHost.subscribeInitializeContracts");

    const {contractId, highRemoteCallIndex} = request;

    // 1. filter
    if (this.#instances[contractId]) {
      logger.info(`Request for initialize new contract ${contractId} receiverd, but the contract is already initialized. Passing`)
      // pass 
      return
    }

    const instance = await SContractPersistent.initialize(
      configuration, contractId, 'QmfRE8M9X3iiJzvVrsHUyDrYywsspgRCqVj9CNS3sqspqx')

    this.#instances[contractId] = instance;
    
    const highLocalCallIndex = instance.getHighLocalCallIndex();
    if (stringToIndex(highLocalCallIndex) < stringToIndex(highRemoteCallIndex)) {
      logger.info(`local callIndex ${highLocalCallIndex} is lower than the remote callIndex ${highRemoteCallIndex}, initialize rolldown request`);
      this.subscribeRolldown({
        contractId: contractId,
        highLocalCallIndex: highLocalCallIndex,
        highRemoteCallIndex: highRemoteCallIndex
      } as RequestRolldown)
    }

    this.#queue[contractId] = new SContractQueue(instance, highRemoteCallIndex);
    this.#executor[contractId] = new SContractExecutor(this.#queue[contractId]);
  }

  public async subscribeDispatch(request: RequestDispatch): Promise<void> {
    const {calls} = request;
    const logger = getLogger("SContractHost.subscribeDispatch");

    for (const call of calls) {
      const currentContractId = call.contractId;
      if (!this.#instances[currentContractId]) {
        logger.warn(`local contract ${currentContractId} not initialized!`);
        // pass
      }
      this.#queue[currentContractId].newCall(call);
      await this.#executor[currentContractId].dispatch();
    }
  }

  public async subscribeRolldown(request: RequestRolldown): Promise<void> {
    const {contractId, highRemoteCallIndex, highLocalCallIndex} = request;
    const logger = getLogger("SContractHost.subscribeRolldown");

    logger.info(`should rolldown ${contractId}, from ${highLocalCallIndex} to ${highRemoteCallIndex}`)
  }
}
