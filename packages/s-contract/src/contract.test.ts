// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';

import { Call, Calls, Contract } from '.';

describe('@skyekiwi/s-contract/contract', function () {
  test('upstream/downstream contract without initial state', async () => {
    const calls = new Calls({
      ops: []
    });

    const contract = Contract.intoSecretContract(calls, new Uint8Array([0x1, 0x2, 0x3, 0x4]));
    const result = await Contract.upstream(contract);

    expect(result).not.toBeNull();

    const downstreamedContract = await Contract.downstream(result);

    expect(downstreamedContract.initialState).toEqual(contract.initialState);
    expect(downstreamedContract.secretId).toEqual(result);
    expect(downstreamedContract.wasmBlob).toEqual(contract.wasmBlob);
  });

  test('upstream/downstream contract without initial state', async () => {
    /* eslint-disable sort-keys, camelcase */
    const call1 = new Call({
      transaction_action: 'create_account',
      receiver: 'test',
      amount: new BN(0x100, 16),
      wasm_file: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const call2 = new Call({
      transaction_action: 'create_account',
      receiver: 'test2',
      amount: new BN(0x100, 16),
      wasm_file: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      method: undefined,
      args: undefined,
      to: undefined
    });
    /* eslint-enable sort-keys, camelcase */

    const calls = new Calls({
      ops: [call1, call2]
    });

    const contract = Contract.intoSecretContract(calls, new Uint8Array([0x1, 0x2, 0x3, 0x4]));
    const result = await Contract.upstream(contract);

    expect(result).not.toBeNull();

    const downstreamedContract = await Contract.downstream(result);

    expect(downstreamedContract.initialState).toEqual(contract.initialState);
    expect(downstreamedContract.secretId).toEqual(result);
    expect(downstreamedContract.wasmBlob).toEqual(contract.wasmBlob);
  });
});
