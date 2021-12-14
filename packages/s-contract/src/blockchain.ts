// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call, RequestDispatch, RequestInitializeContract } from './types';

import { randomBytes } from 'tweetnacl';

import { indexToString, u8aToHex } from '@skyekiwi/util';

export const accounts = [
  { address: '5DZQAycHhT7VbXgxU5qCSrpyPRb7MkCBKHgjVWsb21y8wGTT', secretKey: '25b57e55dd0c9316493d17469b42e6c9e0f6a0a799c667a83d6d3f8a3d4e492a', seed: 'pet strong extra cable apple cable puzzle wise color jazz enough detail', publicKey: 'd3498177e6a88df8c5d4544912c57d81766c7a707408c7695ebf43b3db06f654' },
  { address: '5HDeTJ2EoJwH8z3awapKJSpEVnM7PQbLJAH36HptAcjraTFJ', secretKey: 'c39eb327106cb6fbda64e17c9b22d1d3e8b48abc4ae8191411720b435499fac8', seed: 'bachelor potato cluster educate under change chair arena syrup pelican green object', publicKey: 'a0001989745ee033be5154a210ac41b6949ce5c7018151ed652c6ba8556ef72e' },
  { address: '5HTc6SQovVQ1LoYPnnXXXaJGXWTHFAXQtCyeMK9zNTvsxKJG', secretKey: 'c519a6328fc2f31eb0f5c1a662895bfc5f03b6b2e86a1cbd4d9e9cabb6e6c2b3', seed: 'hour wish mobile negative despair alter van toddler rubber science canvas unable', publicKey: '9a2e8d631c21d507486cc34740228152fbba8c692b1f8a080ca11ab20c368468' },
  { address: '5DDPAzPKYS9DecQ1Sz1eXDXUny8biZADLVhev1Xw17aqpURw', secretKey: 'b7b463a25140e0c1b8fdd86de5a3c97911ebd09f53573ff3f346a69b5e8f3c0b', seed: 'mind bamboo like sun movie grab correct caution recycle once sense video', publicKey: '43cd6342a7795c514a958544399ed5d2e42133f519baf39caf7e8dd18a9dd60d' },
  { address: '5FU4Giw4cgzcNMo3RFbXYzZky54wwuZxzcfCykVhY4NyLHRG', secretKey: '9446b636a159e5ccd1f5eca428f395a3083c2e3cea8fd041167c77d836b5d189', seed: 'milk great child close gap bridge gold typical tennis express oyster beach', publicKey: '226b586b091fc4b1e812755ea65cd56a93c2ee9500f42c8ae71070e765274e7d' },
  { address: '5CQx5oywXSjcr9nSpZPTjtSd8YANNPYTcxbibCjHDDDSsfuz', secretKey: 'ac5f252c834026649832b0a56ac743bde1f61bda643a7ba1dbeae4eaf866e346', seed: 'sweet burden alert artefact air amount outer august kite snake private marine', publicKey: '3911b45819b42e5b173470b8d29f0971ef0066be9526e58d71369f5552b63848' },
  { address: '5EndFwDBSSrtJiNQZWeufPstihELCDG7j9SevQXaGDd3HUCk', secretKey: 'ab75c16a143c81e229d449aab8c4f14455ff3b71bc02184b87d2d228757a917e', seed: 'day unknown smooth sorry frog wedding gospel build idle patient garden price', publicKey: 'bd24a9f43b73938b2118ada5a2285caf1d2c45958d18589037c3fca4c40bb631' },
  { address: '5CHVjBuTTKGmECwtVYFYoN75WnH2f9jZYSYVG9nSngWSm52r', secretKey: 'e7aa0bac6269776fcd266e785cca7f22fb336fd8625c732896b84bc62638cca3', seed: 'toast veteran wire space burger divert dentist brand produce style hospital present', publicKey: '14e5313961e2739acce5c87e9b3f0646c5814af63862ec7fa1bded954db6430a' },
  { address: '5EYpkFEzr5qNPmydCxjcBrXpScMF99qCcrrBtnicrNM7rYd3', secretKey: 'bba8aebf1c7ef89191b9422a877f1144a54917e347f71e4307465029c18c3c44', seed: 'dragon topple agree emotion fence cigar road donate infant link spoon drastic', publicKey: 'e417495ad11a43125b735336aef4ac5c98c37e2409c906dfa4b89881203d7250' },
  { address: '5DtzsnjhkrLSwA5TeSwuvaSTUg6ZthTnXDKZjNQNW6iYQTwj', secretKey: 'c76bebfec712b376cc5599dec2c4ce46ad87605722d6b820ac5b2afaa9d3f53b', seed: 'jungle beauty oxygen correct banana over pizza live vital rocket item fit', publicKey: '6076a00c95ca1c3fef9a55c23e325d217c3b76093cdfa58b22c28f0b629a8d08' },
];

export class MockBlockchainEnv {
  // Map contractId -> nextCallIndex(as number)
  #nextCallIndex: { [key: string]: number }

  // num of blocks to mock
  #blockNum: number

  constructor (blockNum: number) {
    this.#nextCallIndex = {};
  }

  public spanwCalls (contractId: string): Call[] {
    const numberOfCalls = parseInt(Math.random() * 10 + '');
    const calls: Call[] = [];

    let callIndex = this.#nextCallIndex[contractId] ? this.#nextCallIndex[contractId] : 0;

    for (let i = 0; i < numberOfCalls; i++) {
      const origin = parseInt(Math.random() * 10 + '');
      const encrypted = (parseInt(Math.random() * 10 + '') % 4 === 0);
      const methodName = (parseInt(Math.random() * 10 + '') % 4 === 0) ? 'get_greeting' : 'set_greeting';

      calls.push({
        callIndex: indexToString(callIndex++),
        contractId: contractId,
        encrypted: encrypted,
        methodName: methodName,
        origin: accounts[origin].address,
        parameters: u8aToHex(randomBytes(32))
      });
    }

    this.#nextCallIndex[contractId] = callIndex;

    return calls;
  }

  public spawnNewContractReq (callback: Function, contractId: string): void {
    callback({
      contractId: contractId,
      highRemoteCallIndex: indexToString(0)
    } as RequestInitializeContract);
  }

  public spawnBlocks (callback: Function): void {
    // const contractIds = ['0x0001b4'];
    const contractId = '0x0001b4';

    let num = 0;

    setInterval(() => {
      if (num > this.#blockNum) {
        return;
      }

      num++;
      callback(
        {
          calls: this.spanwCalls(contractId)
        } as RequestDispatch
      );
    }, 600);
  }
}
