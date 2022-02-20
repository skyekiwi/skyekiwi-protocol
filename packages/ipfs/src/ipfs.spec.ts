// Copyright 2021-2022 @skyekiwi/ipfs authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import { u8aToHex } from '@skyekiwi/util';

import { IPFS } from '.';

describe('@skyekiwi/ipfs', function () {
  const ipfs = new IPFS();

  test('ipfs works', async () => {
    const cids = [];
    const data = [];

    for (let i = 0; i < 5; i++) {
      data.push(randomBytes(10000));
      const hex = u8aToHex(data[i]);

      cids.push(await ipfs.add(hex));
      expect(cids[i].size).toBeGreaterThanOrEqual(10000 * 2);
    }

    for (let i = 0; i < 5; i++) {
      const content = await ipfs.cat(cids[i].cid);

      expect(content).toEqual(u8aToHex(data[i]));
    }
  });

  // test('header', async() => {
  //   const authHeader = 'bmVhci03Wm9zdjVIQmRINmNTcGFVQXZmcDZMVjk4clpQMlZhYlI2R2ZpQXlQUGI4UjpmM2ZkNDYwNTM3MDYzYTgyM2VjMzdlNGJmZmNhZTQzMWY3MmYzODhkNmU5MWExMzZkMzNhYzRmODU0N2IwMzE5MjMzMGYxNmQ3NGQ0Y2RmZTIzOWNmY2M4ZGFjZTA1ZWVlMDRjNTkyNGNkOGNhM2I4N2EzNWQ2NjExMjM4MGQwOA==';
  //   const content = "asdjfkjasklfjsdkjfsjdf";

  //   const result = await request
  //     .post('https://crustwebsites.net/api/v0/add')
  //     .set('Authorization', `Basic ${authHeader}`)
  //     .type('form')
  //     .field('file', content);

  //   const catResult = await request
  //     .post(`https://crustwebsites.net/api/v0/cat?arg=${result.body.Hash}`)
  //     .set('Authorization', `Basic ${authHeader}`);

  //   // ({
  //   //   method: "POST",
  //   //   url: 'https://crustwebsites.net' + '/api/v0/add',
  //   //   headers: {'Authentication': `Basic ${authHeader}`},
  //   //   data: {
  //   //     file: content
  //   //   }
  //   // });

  //   console.log(result.body);
  //   console.log(catResult.text);

  // })
});
