// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { mnemonicValidate } from '@polkadot/util-crypto';
import BN from 'bn.js';
import dotenv from 'dotenv';

import { SecretRegistry } from '@skyekiwi/secret-registry';
import { u8aToHex } from '@skyekiwi/util';

import { Call, Calls, ContractController } from '.';

dotenv.config();

describe('@skyekiwi/s-contract/contract', function () {
  const mnemonic = process.env.SEED_PHRASE;

  if (!mnemonicValidate(mnemonic)) {
    throw new Error('mnemonic failed to read - e2e.spec.ts');
  }

  const registry = new SecretRegistry(mnemonic, {});

  afterAll(async () => {
    await registry.disconnect();
  });

  test('upstream/downstream contract without initial state', async () => {
    const calls = new Calls({
      ops: []
    });

    const contract = ContractController.intoSecretContract(calls, new Uint8Array([0x1, 0x2, 0x3, 0x4]));
    const result = await ContractController.upstream(registry, contract);

    expect(result).not.toBeNull();

    const downstreamedContract = await ContractController.downstream(registry, result);

    expect(u8aToHex(downstreamedContract.initialState)).toEqual(u8aToHex(contract.initialState));
    expect(downstreamedContract.secretId).toEqual(result);
    expect(downstreamedContract.wasmBlob).toEqual(contract.wasmBlob);

    // await registry.disconnect();
  });

  test('upstream/downstream contract with initial state', async () => {
    /* eslint-disable sort-keys, camelcase */
    const call1 = new Call({
      origin: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      origin_public_key: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      encrypted_egress: false,

      transaction_action: 'create_account',
      receiver: 'test',
      amount: new BN(0x100, 16),
      wasm_blob: new Uint8Array([1, 2, 3]),
      method: undefined,
      args: undefined,
      to: undefined
    });

    const call2 = new Call({
      origin: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      origin_public_key: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      encrypted_egress: false,

      transaction_action: 'create_account',
      receiver: 'test2',
      amount: new BN(0x100, 16),
      wasm_blob: new Uint8Array([1, 2, 3]),
      method: undefined,
      args: undefined,
      to: undefined
    });
    /* eslint-enable sort-keys, camelcase */

    const calls = new Calls({
      ops: [call1, call2]
    });

    const contract = ContractController.intoSecretContract(calls, new Uint8Array([0x1, 0x2, 0x3, 0x4]));
    const result = await ContractController.upstream(registry, contract);

    expect(result).not.toBeNull();

    const downstreamedContract = await ContractController.downstream(registry, result);

    expect(u8aToHex(downstreamedContract.initialState)).toEqual(u8aToHex(contract.initialState));
    expect(downstreamedContract.secretId).toEqual(result);
    expect(u8aToHex(downstreamedContract.wasmBlob)).toEqual(u8aToHex(contract.wasmBlob));

    await registry.disconnect();
  });
});