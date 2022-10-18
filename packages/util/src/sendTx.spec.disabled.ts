// Copyright 2021-2022 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { EventEmitter } from 'events';

import { initWASMInterface } from '@skyekiwi/crypto';

import { sendTx, txProgressText } from '.';

describe('@skyekiwi/util/sendTx', function () {
  const progress = new EventEmitter();

  progress.on('progress', (name: string, status: string) => {
    console.log(txProgressText[name](status));
  });

  test('sending transaction', async () => {
    await initWASMInterface();

    const provider = new WsProvider('wss://staging.rpc.skye.kiwi');
    const api = await ApiPromise.create({ provider: provider });

    const kr = (new Keyring({ type: 'sr25519' })).addFromUri('//test');

    console.log(kr.address);

    const tx = api.tx.balances.transfer(
      '5CQ5PxbmUkAzRnLPUkU65fZtkypqpx8MrKnAfXkSy9eiSeoM',
      1
    );

    const evt = await sendTx(tx, kr, progress);

    evt.map((e) => console.log(e.toHuman()));
    await provider.disconnect();
  });
});
