// Copyright 2021 @skyekiwi/ipfs authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Logger } from '@skyekiwi/util/types';
import type { IPFSNode, IPFSResult } from './types';

import AbortController from 'abort-controller';
import ipfs from 'ipfs-core';
import createClient from 'ipfs-http-client';
import fetch, { RequestInit } from 'node-fetch';

import { getLogger } from '@skyekiwi/util';

export class IPFS {
  private localIpfsReady: boolean
  private localIpfs: IPFSNode

  constructor () {
    this.localIpfsReady = false;
  }

  public async init (): Promise<void> {
    const logger = getLogger('ipfs.init');

    try {
      this.localIpfsReady = true;
      this.localIpfs = await ipfs.create();

      logger.debug('ipfs spawned');
      logger.trace(this.localIpfs);
    } catch (err) {
      console.warn(err);
      // pass
      // this is where there is already an ipfs node running
    }
  }

  public async stopIfRunning (): Promise<void> {
    const logger = getLogger('ipfs.stopIfRunning');

    if (this.localIpfsReady) {
      logger.debug('ipfs stopping');
      await this.localIpfs.stop();
    }
  }

  public async add (str: string): Promise<IPFSResult> {
    const logger = getLogger('ipfs.add');

    logger.trace('Uploading %s', str);
    logger.debug('Uploading %d bytes to IPFS', str.length);

    try {
      logger.debug('pushing to remote IPFS nodes');
      const remoteResult = await this.remoteGatewayAddAndPin(str);

      if (remoteResult !== null) return remoteResult;
    } catch (err) {
      // pass
    }

    logger.warn('all remote push failed, fallback to local IPFS, you need to keep the local IPFS running');

    try {
      await this.init();
      const cid = await this.localIpfs.add(str);
      const fileStat = await this.localIpfs.files.stat('/ipfs/' + cid.path);

      logger.debug('bytes pushed as', {
        cid: cid.path, size: fileStat.cumulativeSize
      });

      return {
        cid: cid.path, size: fileStat.cumulativeSize
      };
    } catch (err) {
      logger.error('local ipfs pushing failed', err);
      throw (new Error('IPFS Failure: ipfs.add'));
    }
  }

  public async cat (cid: string): Promise<string> {
    const logger = getLogger('ipfs.add');

    if (cid.length !== 46) {
      throw new Error('cid length error: ipfs.cat');
    }

    try {
      logger.debug('fetching from remote ipfs gateways');
      const remoteResult = await this.fetchFileFromRemote(cid);

      logger.debug('fetched %s', cid);

      return remoteResult;
    } catch (err) {
      logger.info('remote gateways failed, fetching from local IPFS node');

      try {
        let result = '';

        await this.init();

        for await (const chunk of this.localIpfs.cat(cid)) {
          result += chunk;
        }

        logger.debug('fetched from local', result);

        return result;
      } catch (err) {
        throw (new Error('IPFS Failure: ipfs.cat'));
      }
    }
  }

  public async addAndPinInfura (content: string): Promise<IPFSResult> {
    const logger = getLogger('ipfs.addAndPinInfura');

    logger.trace('pushing to infura %s', content);

    const infura = createClient({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Request-Method': 'POST'
      },
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https'
    });

    const infuraResult = await infura.add(content);

    await infura.pin.add(infuraResult.cid.toString());

    logger.debug('content pushed', {
      cid: infuraResult.path,
      size: infuraResult.size
    });

    return {
      cid: infuraResult.path,
      size: infuraResult.size
    };
  }

  public async addAndPinSkyeKiwi (content: string): Promise<IPFSResult> {
    const logger = getLogger('ipfs.addAndPinSkyeKiwi');

    logger.trace('pushing to SkyeKiwi IPFS nodes %s', content);

    const skyekiwiNode = createClient({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Request-Method': 'POST'
      },
      host: 'sgnode.skye.kiwi',
      port: 5001,
      protocol: 'http'
    });

    const skyekiwiResult = await skyekiwiNode.add(content);

    await skyekiwiNode.pin.add(skyekiwiResult.cid.toString());

    logger.debug('content pushed', {
      cid: skyekiwiResult.path,
      size: skyekiwiResult.size
    });

    return {
      cid: skyekiwiResult.path,
      size: skyekiwiResult.size
    };
  }

  public async remoteGatewayAddAndPin (content: string): Promise<IPFSResult> {
    const logger: Logger = getLogger('ipfs.remoteGatewayAddAndPin');

    try {
      logger.debug('pushing to SkyeKiwi IPFS nodes');

      return await this.addAndPinSkyeKiwi(content);
    } catch (err) {
      logger.warn('pushing to SkyeKiwi IPFS nodes failed', err);

      try {
        logger.debug('pushing to Infura nodes');

        return await this.addAndPinInfura(content);
      } catch (err) {
        logger.warn('pushing to all Infura nodes failed', err);
        logger.warn('pushing to all remote nodes failed', err);
        throw new Error('all remote pin failed - ipfs.remoteGatewayAddAndPin');
      }
    }
  }

  // public async fetchFileFromRemote (cid: string): Promise<string> {
  //   const logger = getLogger('ipfs.fetchFileFromRemote');
  //   const controller = new AbortController();

  //   try {
  //     const requests = [
  //       // fetch(`http://ipfs.io/ipfs/${cid}`, {
  //       //   mode: 'no-cors',
  //       //   signal: controller.signal
  //       // } as RequestInit).then((res) => {
  //       //   if (res.ok) { return res; } else {
  //       //     throw new Error('public gateway non-200 response');
  //       //   }
  //       // }),
  //       fetch(`http://gateway.ipfs.io/ipfs/${cid}`, {
  //         mode: 'no-cors',
  //         signal: controller.signal
  //       } as RequestInit).then((res) => {
  //         if (res.ok) { return res; } else {
  //           throw new Error('public gateway non-200 response');
  //         }
  //       }),
  //       fetch(`http://gateway.originprotocol.com/ipfs/${cid}`, {
  //         mode: 'no-cors',
  //         signal: controller.signal
  //       } as RequestInit).then((res) => {
  //         if (res.ok) { return res; } else {
  //           throw new Error('public gateway non-200 response');
  //         }
  //       }),
  //       fetch(`http://ipfs.fleek.co/ipfs/${cid}`, {
  //         mode: 'no-cors',
  //         signal: controller.signal
  //       } as RequestInit).then((res) => {
  //         if (res.ok) { return res; } else {
  //           throw new Error('public gateway non-200 response');
  //         }
  //       }),
  //       fetch(`http://cloudflare-ipfs.com/ipfs/${cid}`, {
  //         mode: 'no-cors',
  //         signal: controller.signal
  //       } as RequestInit).then((res) => {
  //         if (res.ok) { return res; } else {
  //           throw new Error('public gateway non-200 response');
  //         }
  //       })
  //     ];

  //     logger.debug('fetching files from public gateways', cid);

  //     const result = await Promise.any(requests);

  //     if (result.status !== 200) {
  //       logger.debug('remote gateway returned non-200 response', result);
  //       throw new Error('public gateway non-200 response - ipfs.fetchFileFromRemote');
  //     }

  //     controller.abort();

  //     return await result.text();
  //   } catch (err) {
  //     if (err !== 'AbortError') {
  //       logger.warn('public gateway failed');
  //     }

  //     try {
  //       logger.debug('public gateway failed. Trying Infura');

  //       const infura = createClient({
  //         headers: {
  //           'Access-Control-Allow-Origin': '*'
  //         },
  //         host: 'ipfs.infura.io',
  //         port: 5001,
  //         protocol: 'https'
  //       });
  //       let result = '';
  //       const stream = infura.cat(cid);

  //       for await (const chunk of stream) {
  //         result += chunk.toString();
  //       }

  //       logger.debug('fetched from Infura', result);

  //       return result;
  //     } catch (err) {
  //       logger.warn('infura gateway failed', err);

  //       try {
  //         logger.debug('public gateway & Infura failed. Trying SkyeKiwi');
  //         const skyekiwiNode = createClient({
  //           headers: {
  //             'Access-Control-Allow-Origin': '*'
  //           },
  //           host: 'sgnode.skye.kiwi',
  //           port: 5001,
  //           protocol: 'http'
  //         });
  //         let result = '';
  //         const stream = skyekiwiNode.cat(cid);

  //         for await (const chunk of stream) {
  //           result += chunk.toString();
  //         }

  //         logger.debug('fetched from SkyeKiwi', result);

  //         return result;
  //       } catch (err) {
  //         logger.warn('skyekiwi gateway failed', err);
  //         logger.warn('all remote gateway failed', err);
  //         throw new Error('remote file fetching failed - ipfs.fetchFileFromRemote');
  //       }
  //     }
  //   }
  // }
  public async fetchFileFromRemote (cid: string): Promise<string> {
    const logger = getLogger('ipfs.fetchFileFromRemote');
    const controller = new AbortController();

    try {
      logger.debug('public gateway failed. Trying Infura');

      const infura = createClient({
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
      });
      let result = '';
      const stream = infura.cat(cid);

      for await (const chunk of stream) {
        result += chunk.toString();
      }

      logger.debug('fetched from Infura', result);

      return result;
    } catch (err) {
      logger.warn('infura gateway failed', err);

      try {
        logger.debug('public gateway & Infura failed. Trying SkyeKiwi');
        const skyekiwiNode = createClient({
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          host: 'sgnode.skye.kiwi',
          port: 5001,
          protocol: 'http'
        });
        let result = '';
        const stream = skyekiwiNode.cat(cid);

        for await (const chunk of stream) {
          result += chunk.toString();
        }

        logger.debug('fetched from SkyeKiwi', result);

        return result;
      } catch (err) {
        try {
          const requests = [
            fetch(`http://ipfs.io/ipfs/${cid}`, {
              mode: 'no-cors',
              signal: controller.signal
            } as RequestInit).then((res) => {
              if (res.ok) { return res; } else {
                throw new Error('public gateway non-200 response');
              }
            }),
            fetch(`http://gateway.ipfs.io/ipfs/${cid}`, {
              mode: 'no-cors',
              signal: controller.signal
            } as RequestInit).then((res) => {
              if (res.ok) { return res; } else {
                throw new Error('public gateway non-200 response');
              }
            }),
            fetch(`http://gateway.originprotocol.com/ipfs/${cid}`, {
              mode: 'no-cors',
              signal: controller.signal
            } as RequestInit).then((res) => {
              if (res.ok) { return res; } else {
                throw new Error('public gateway non-200 response');
              }
            }),
            fetch(`http://ipfs.fleek.co/ipfs/${cid}`, {
              mode: 'no-cors',
              signal: controller.signal
            } as RequestInit).then((res) => {
              if (res.ok) { return res; } else {
                throw new Error('public gateway non-200 response');
              }
            }),
            fetch(`http://cloudflare-ipfs.com/ipfs/${cid}`, {
              mode: 'no-cors',
              signal: controller.signal
            } as RequestInit).then((res) => {
              if (res.ok) { return res; } else {
                throw new Error('public gateway non-200 response');
              }
            })
          ];

          logger.debug('fetching files from public gateways', cid);

          const result = await Promise.race(requests);

          if (result.status !== 200) {
            logger.debug('remote gateway returned non-200 response', result);
            throw new Error('public gateway non-200 response - ipfs.fetchFileFromRemote');
          }

          controller.abort();

          return await result.text();
        } catch (err) {
          logger.warn('skyekiwi gateway failed', err);
          logger.warn('all remote gateway failed', err);
          throw new Error('remote file fetching failed - ipfs.fetchFileFromRemote');
        }
      }
    }
  }
}
