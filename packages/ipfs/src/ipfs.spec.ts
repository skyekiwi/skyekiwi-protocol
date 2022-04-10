// Copyright 2021-2022 @skyekiwi/ipfs authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import { u8aToHex } from '@skyekiwi/util';

import { IPFS } from '.';

describe('@skyekiwi/ipfs', function () {
  test('ipfs works', async () => {
    const cids = [];
    const data = [];

    for (let i = 0; i < 5; i++) {
      data.push(randomBytes(10000));
      const hex = u8aToHex(data[i]);

      cids.push(await IPFS.add(hex));
      expect(cids[i].size).toBeGreaterThanOrEqual(10000 * 2);
    }

    for (let i = 0; i < 5; i++) {
      const content = await IPFS.cat(cids[i].cid);

      expect(content).toEqual(u8aToHex(data[i]));
    }
  });
});
