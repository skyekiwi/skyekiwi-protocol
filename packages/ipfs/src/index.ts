// Copyright 2021-2022 @skyekiwi/ipfs authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IPFSResult } from './types';

import superagent from 'superagent';

// WIP - the IPFS connector might go through lots of changes
export class IPFS {
  private async pin (authHeader: string, cid: string): Promise<boolean> {
    if (cid.length !== 46) {
      throw new Error('CID len err');
    }

    const res = await superagent
      .post('https://pin.crustcode.com/psa/pins')
      .set('Authorization', `Bearer ${authHeader}`)
      .send({
        cid: cid,
        name: 'skyekiwi-protocol-file'
      });

    return res.statusCode === 200;
  }

  private async upload (authHeader: string, content: string): Promise<IPFSResult> {
    const res = await superagent
      .post('https://crustwebsites.net/api/v0/add')
      .set('Authorization', `Basic ${authHeader}`)
      .type('form')
      .field('file', content);

    /* eslint-disable */
    return {
      cid: res.body.Hash,
      size: Number(res.body.Size)
    };
    /* eslint-enable */
  }

  private async download (authHeader: string, cid: string): Promise<string> {
    const res = await superagent
      .post(`https://crustwebsites.net/api/v0/cat?arg=${cid}`)
      .set('Authorization', `Basic ${authHeader}`);

    return res.text;
  }

  async add (content: string, authHeader?: string): Promise<IPFSResult> {
    const auth = authHeader || 'bmVhci03Wm9zdjVIQmRINmNTcGFVQXZmcDZMVjk4clpQMlZhYlI2R2ZpQXlQUGI4UjpmM2ZkNDYwNTM3MDYzYTgyM2VjMzdlNGJmZmNhZTQzMWY3MmYzODhkNmU5MWExMzZkMzNhYzRmODU0N2IwMzE5MjMzMGYxNmQ3NGQ0Y2RmZTIzOWNmY2M4ZGFjZTA1ZWVlMDRjNTkyNGNkOGNhM2I4N2EzNWQ2NjExMjM4MGQwOA==';
    let reTries = 3;
    let res;

    while (reTries >= 0) {
      try {
        res = await this.upload(auth, content);
      } catch (e) {}

      if (res) break;
      reTries--;
    }

    reTries = 3;

    while (reTries >= 0) {
      try {
        const r = await this.pin(auth, res.cid);

        if (r) break;
      } catch (e) {}

      reTries--;
    }

    return res;
  }

  async cat (cid: string, authHeader?: string): Promise<string> {
    const auth = authHeader || 'bmVhci03Wm9zdjVIQmRINmNTcGFVQXZmcDZMVjk4clpQMlZhYlI2R2ZpQXlQUGI4UjpmM2ZkNDYwNTM3MDYzYTgyM2VjMzdlNGJmZmNhZTQzMWY3MmYzODhkNmU5MWExMzZkMzNhYzRmODU0N2IwMzE5MjMzMGYxNmQ3NGQ0Y2RmZTIzOWNmY2M4ZGFjZTA1ZWVlMDRjNTkyNGNkOGNhM2I4N2EzNWQ2NjExMjM4MGQwOA==';

    let reTries = 3;
    let res;

    while (reTries >= 0) {
      try {
        res = await this.download(auth, cid);
      } catch (e) {}

      if (res) break;
      reTries--;
    }

    return res;
  }
}
