// Copyright 2021-2022 @skyekiwi/ipfs authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IPFSResult } from './types';

import got from 'got';
import { create } from 'ipfs-http-client';

// WIP - the IPFS connector might go through lots of changes
export class IPFS {
  private async pin (authHeader: string, cid: string): Promise<string> {
    if (cid.length !== 46) {
      throw new Error('CID len err');
    }

    const { body } = await got.post(
      'https://pin.crustcode.com/psa' + '/pins',
      {
        headers: {
          authorization: 'Bearer ' + authHeader
        },
        json: {
          cid: cid,
          name: 'near-live-file.txt'
        }
      }
    );

    return body;
  }

  private async upload (authHeader: string, content: string): Promise<IPFSResult> {
    const ipfs = create({
      headers: {
        authorization: 'Basic ' + authHeader
      },
      url: 'https://crustwebsites.net'
    });

    const result = await ipfs.add(content);

    return {
      cid: result.cid.toString(),
      size: result.size
    };
  }

  private async download (authHeader: string, cid: string): Promise<string> {
    let result = '';
    const ipfs = create({
      headers: {
        authorization: 'Basic ' + authHeader
      },
      url: 'https://crustwebsites.net'
    });

    const content = ipfs.cat(cid);

    for await (const chunk of content) {
      result += chunk.toString();
    }

    return result;
  }

  async add (content: string, authHeader?: string): Promise<IPFSResult> {
    const auth = authHeader || 'bmVhci03Wm9zdjVIQmRINmNTcGFVQXZmcDZMVjk4clpQMlZhYlI2R2ZpQXlQUGI4UjpmM2ZkNDYwNTM3MDYzYTgyM2VjMzdlNGJmZmNhZTQzMWY3MmYzODhkNmU5MWExMzZkMzNhYzRmODU0N2IwMzE5MjMzMGYxNmQ3NGQ0Y2RmZTIzOWNmY2M4ZGFjZTA1ZWVlMDRjNTkyNGNkOGNhM2I4N2EzNWQ2NjExMjM4MGQwOA==';
    const result = await this.upload(auth, content);

    await this.pin(auth, result.cid);

    return result;
  }

  async cat (cid: string, authHeader?: string): Promise<string> {
    const auth = authHeader || 'bmVhci03Wm9zdjVIQmRINmNTcGFVQXZmcDZMVjk4clpQMlZhYlI2R2ZpQXlQUGI4UjpmM2ZkNDYwNTM3MDYzYTgyM2VjMzdlNGJmZmNhZTQzMWY3MmYzODhkNmU5MWExMzZkMzNhYzRmODU0N2IwMzE5MjMzMGYxNmQ3NGQ0Y2RmZTIzOWNmY2M4ZGFjZTA1ZWVlMDRjNTkyNGNkOGNhM2I4N2EzNWQ2NjExMjM4MGQwOA==';

    return await this.download(auth, cid);
  }
}
