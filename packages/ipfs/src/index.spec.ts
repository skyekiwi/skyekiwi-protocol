// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import * as Util from '@skyekiwi/util';

import { IPFS } from '.';

describe('@skyekiwi/ipfs', function () {
  const ipfs = new IPFS();

  test('ipfs works', async () => {
    const cids = [];
    const data = [];

    for (let i = 0; i < 5; i++) {
      data.push(randomBytes(10000));
      const hex = Util.u8aToHex(data[i]);

      cids.push(await ipfs.add(hex));
      expect(cids[i].size).toBeGreaterThanOrEqual(10000 * 2);
    }

    for (let i = 0; i < 5; i++) {
      const content = await ipfs.cat(cids[i].cid);

      expect(content).toEqual(Util.u8aToHex(data[i]));
    }

    await ipfs.stopIfRunning();
  });
});
