// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call, RequestInitializeContract } from './types'

import { expose } from 'threads/worker';
import { getLogger, indexToString, stringToIndex } from '@skyekiwi/util'

import { SContractPersistent, SContractReader } from '.';
import configuration from './config'

let instance: SContractReader;
let currentContractId: string;

const executor = console.log;
let currentHighRemoteCallIndex: string
let currentHighLocalCallIndex: string

const enclaveMock = {

  async initialzeContract(request: RequestInitializeContract) {
    const {contractId, wasmBlob, highRemoteCallIndex} = request;

    const logger = getLogger("enclaveMock.initializeContract");

    logger.info(`initializing contract id ${contractId}`);

    instance = await SContractPersistent.initialize(
      configuration, contractId,  wasmBlob
    )
    
    currentHighLocalCallIndex = instance.getHighLocalCallIndex();
    currentHighRemoteCallIndex = highRemoteCallIndex;

    if (stringToIndex(currentHighLocalCallIndex) < stringToIndex(highRemoteCallIndex)) {
      logger.info(`local callIndex ${currentHighLocalCallIndex} is lower than the remote callIndex ${highRemoteCallIndex}, initialize rolldown request`);
    }
  },
  async dispatchCall(call: Call) {
    const logger = getLogger('enclaveMock.dispatchCall');

    const currentHighLocalCallIndexNumber = stringToIndex(currentHighLocalCallIndex)

    logger.info(`dispatched call ${currentContractId}`);
    logger.info(`remote call ${currentHighRemoteCallIndex} & local call ${currentHighLocalCallIndex}`)

    const callIndexNumber = stringToIndex(call.callIndex);
    if (callIndexNumber === currentHighLocalCallIndexNumber + 1) {
      executor(call);
      currentHighLocalCallIndex = indexToString(currentHighLocalCallIndexNumber + 1);
    } else {
      if (callIndexNumber > currentHighLocalCallIndexNumber) {
        throw new Error(`needs rolldown, local execution queue too low`);
      } else {
        logger.error(`unexpected index - local ${currentHighLocalCallIndexNumber} & remote ${callIndexNumber}`);
        throw new Error(`unexpected`)
      }
    }
  },
}

expose(enclaveMock)
