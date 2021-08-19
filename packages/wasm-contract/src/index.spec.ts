// Copyright 2021 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import abi from './mock/skyekiwi.json';
import types from './mock/types';
import { WASMContract } from '.';

// eslint-disable-next-line
require('dotenv').config();

describe('@skyekiwi/wasm-contract', () => {
  const mnemonic = process.env.SEED_PHRASE;

  test('place transactions', async () => {
    const contract = new WASMContract(mnemonic, types, abi, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg');

    await contract.init();

    const contractResult = await contract.execContract(
      'createVault', ['QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm']);

    expect(contractResult).toHaveProperty('ok');

    await contract.disconnect();
  });
});
