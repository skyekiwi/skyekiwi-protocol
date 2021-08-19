// Copyright 2021 @skyekiwi/crust-network authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IPFSResult } from '@skyekiwi/ipfs/types';

import { randomBytes } from 'tweetnacl';

import { IPFS } from '@skyekiwi/ipfs';
import { u8aToHex } from '@skyekiwi/util';

import { Crust } from '.';

// eslint-disable-next-line
require('dotenv').config();

describe('@skyekiwi/crust-network', () => {
  const ipfs = new IPFS();
  const mnemonic = process.env.SEED_PHRASE;

  test('place orders', async () => {
    const crust = new Crust(mnemonic);

    await crust.init();

    const content: IPFSResult[] = [];

    for (let i = 0; i < 3; i++) {
      content.push(await ipfs.add(u8aToHex(randomBytes(1000))));
    }

    const crustResult = await crust.placeBatchOrderWithCIDList(content);

    expect(crustResult).toEqual(true);
    await ipfs.stopIfRunning();
  });
});
