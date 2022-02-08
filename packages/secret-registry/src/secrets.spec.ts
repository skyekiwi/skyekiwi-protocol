// Copyright 2021 - 2022 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SecretRegistry } from '.';

// eslint-disable-next-line
require('dotenv').config();

describe('@skyekiwi/secret-registry', () => {
  const mnemonic = process.env.SEED_PHRASE;

  test('place transactions', async () => {
    const contract = new SecretRegistry(mnemonic, {});

    await contract.init();

    const contractResult = await contract.registerSecret('QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm');

    console.log(contractResult);
    
    expect(contractResult).toEqual(0);

    await contract.disconnect();
  });
});
