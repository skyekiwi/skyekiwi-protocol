// Copyright 2021-2022 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { EventEmitter } from 'events';

import { initWASMInterface } from '@skyekiwi/crypto';
import { sendTx, txProgressText } from '@skyekiwi/util';

import { SecretRegistry } from '.';

describe('@skyekiwi/secret-registry', () => {
  const progress = new EventEmitter();

  progress.on('progress', (name: string, status: string) => {
    console.log(txProgressText[name](status));
  });

  test('register secrets & update metadata', async () => {
    await initWASMInterface();

    const provider = new WsProvider('wss://staging.rpc.skye.kiwi');
    const api = await ApiPromise.create({ provider: provider });

    const kr = (new Keyring({ type: 'sr25519' })).addFromUri('//test');

    const metadata = new Uint8Array([0, 1, 2]);
    const metadata2 = new Uint8Array([0, 1, 2, 3]);

    const nextSecretId = await SecretRegistry.nextSecretId(api);
    const registerTx = SecretRegistry.registerSecret(api, metadata);
    const evt = await sendTx(api.tx(registerTx), kr, progress);
    const secretId = Number(evt.find(({ event: { method } }) => method === 'SecretRegistered').event.data[0].toString());

    expect(secretId).toEqual(nextSecretId);

    const remoteMetadata = await SecretRegistry.getMetadata(api, nextSecretId);

    expect(remoteMetadata).toEqual(metadata);

    const updateTx = SecretRegistry.updateMetadata(api, secretId, metadata2);
    const evt2 = await sendTx(api.tx(updateTx), kr, progress);
    const _secretId = Number(evt2.find(({ event: { method } }) => method === 'SecretUpdated').event.data[0].toString());

    expect(_secretId).toEqual(secretId);

    const remoteMetadata2 = await SecretRegistry.getMetadata(api, _secretId);

    expect(remoteMetadata2).toEqual(metadata2);

    await provider.disconnect();
  });
});
