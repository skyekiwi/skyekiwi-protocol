// Copyright 2021-2022 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SecretRegistry } from '.';

// eslint-disable-next-line
require('dotenv').config();

describe('@skyekiwi/secret-registry', () => {
  const mnemonic = process.env.SEED_PHRASE;

  test('register secrets & update metadata', async () => {
    const registry = new SecretRegistry(mnemonic, {});
    const metadata = 'QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm';
    const metadata2 = 'QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLQ';

    await registry.init();

    const nextSecretId = await registry.nextSecretId();
    const contractResult = await registry.registerSecret(metadata);

    const remoteMetadata = await registry.getMetadata(nextSecretId);

    expect(contractResult).toEqual(nextSecretId);
    expect(remoteMetadata).toEqual(metadata);

    const update = await registry.updateMetadata(contractResult, metadata2);

    expect(update).toEqual(true);

    const remoteMetadata2 = await registry.getMetadata(nextSecretId);

    expect(remoteMetadata2).toEqual(metadata2);

    await registry.disconnect();
  });
});
