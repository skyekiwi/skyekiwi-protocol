// Copyright 2021-2022 @skyekiwi/ipfs authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IPFSResult } from './types';

import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import superagent from 'superagent';

import { u8aToHex } from '@skyekiwi/util';

// https://gw.crustapps.net/ipfs/QmeALtHnjohoKnNmFfxjbuPwhiaHS2SmTaVXyigb5SfBW9
const crustGateways = [
  // 'https://ipfs-gw.dkskcloud.com'
//  'https://gw.crustapps.net',
  'https://crustwebsites.net',
  'https://crustipfs.xyz',
  'https://ipfs-gw.decloud.foundation'
];

// WIP - the IPFS connector might go through lots of changes
export class IPFS {
  private static async pin (authHeader: string, cid: string): Promise<boolean> {
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

  private static async upload (authHeader: string, content: string): Promise<IPFSResult> {
    const req = [];

    for (const endpoint of crustGateways) {
      req.push(
        superagent
          .post(`${endpoint}/api/v0/add`)
          .timeout({
            deadline: 60000, // but allow 1 minute for the file to finish loading.
            response: 10000 // Wait 10 seconds for the server to start sending,
          })
          .set('Authorization', `Basic ${authHeader}`)
          .type('form')
          .field('file', content)
      );
    }

    const res = await (async () => {
      for (const r of req) {
        try {
          return await r;
        } catch (e) { }
      }

      return null;
    })();

    if (!res) {
      return null;
    }

    /* eslint-disable */
    return {
      cid: res.body.Hash,
      size: Number(res.body.Size)
    };
    /* eslint-enable */
  }

  private static async downloadLocal (cid: string): Promise<string> {
    const r = await superagent
      .post(`http://127.0.0.1:5001/api/v0/cat?arg=${cid}`)
      .timeout({
        deadline: 120000, // but allow 2 minute for the file to finish loading.
        response: 60000 // Wait 1 minute for the server to start sending,
      });

    console.log(r);

    return r.text;
  }

  private static async download (authHeader: string, cid: string): Promise<string> {
    const req = [];

    for (const endpoint of crustGateways) {
      req.push(
        superagent
          .get(`${endpoint}/ipfs/${cid}`)
          .timeout({
            deadline: 120000, // but allow 2 minute for the file to finish loading.
            response: 60000 // Wait 1 minute for the server to start sending,
          })
          // .set('Authorization', `Basic ${authHeader}`)
      );
    }

    const res = await (async () => {
      for (const r of req) {
        try {
          return await r;
        } catch (e) { }
      }

      return null;
    })();

    if (!res) {
      return null;
    }

    return res.text;
  }

  public static async add (content: string, authHeader?: string): Promise<IPFSResult> {
    const auth = authHeader || this.generateRandomAuthHeader();
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

  public static async cat (cid: string, authHeader?: string): Promise<string> {
    const auth = authHeader || this.generateRandomAuthHeader();

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

  public static async catLocal (cid: string): Promise<string> {
    let reTries = 3;
    let res;

    while (reTries >= 0) {
      try {
        res = await this.downloadLocal(cid);
      } catch (e) {}

      if (res) break;
      reTries--;
    }

    return res;
  }

  private static generateRandomAuthHeader (): string {
    const seed = mnemonicGenerate();
    const pair = (new Keyring()).addFromUri(seed);

    const sig = u8aToHex(pair.sign(pair.address));
    const authHeader = Buffer.from(`sub-${pair.address}:0x${sig}`).toString('base64');

    return authHeader;
  }
}
