// Copyright 2021 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IPFSResult } from '@skyekiwi/ipfs/types';
import type { ChunkList, PreSealData, SealedData } from './types';

import { EncryptionSchema, SCryptor, Seal, Sealer } from '@skyekiwi/crypto';
import { IPFS } from '@skyekiwi/ipfs';
import { hexToU8a, stringToU8a, trimEnding, u8aToHex, u8aToString } from '@skyekiwi/util';

// version code in Uint8Array
export const SKYEKIWI_VERSION = new Uint8Array([0, 0, 0, 1]);

export class Metadata {
  public chunkList: ChunkList
  public chunkListCID: IPFSResult
  public hash: Uint8Array
  public sealer: Sealer

  public async generatePreSealingMetadata (): Promise<Uint8Array> {
    let chunk = '';

    for (const chunksId in this.chunkList) {
      // 46 char
      chunk += this.chunkList[chunksId].ipfsCID;

      // 1 char divider
      chunk += '-';
    }

    const encryptedChunk = u8aToHex(this.sealer.sCryptor.seal(stringToU8a(trimEnding(chunk))));

    const ipfs = new IPFS();
    const cid = await ipfs.add(encryptedChunk);

    this.chunkListCID = {
      cid: cid.cid.toString(),
      size: cid.size
    };
    const chunkCIDU8a = stringToU8a(this.chunkListCID.cid);

    const result = new Uint8Array(
      // sealingKey, hash, Author
      32 * 3 +
      // skyekiwi version
      4 +
      // an IPFS CID in binary
      46
    );

    if (
      !(this.sealer.sCryptor.getSealingKey().length === 32) ||
      !(this.hash.length === 32) ||
      !(this.sealer.aCryptor.getAuthorKey().length === 32) ||
      !(SKYEKIWI_VERSION.length === 4) ||
      !(chunkCIDU8a.length === 46)
    ) {
      throw new Error('pre-sealing error - Metadata.getPreSealData');
    }

    result.set(this.sealer.sCryptor.getSealingKey(), 0);
    result.set(this.hash, 32);
    result.set(this.sealer.aCryptor.getAuthorKey(), 64);
    result.set(SKYEKIWI_VERSION, 96);
    result.set(chunkCIDU8a, 100);

    return result;
  }

  public async generateSealedMetadata (encryptionSchema: EncryptionSchema): Promise<string> {
    const preSealData = await this.generatePreSealingMetadata();

    if (preSealData.length !== 146) {
      throw new Error('pre-seal data len error - Metadata.generateSealedMetadata');
    }

    const sealed = Seal.seal(
      preSealData,
      encryptionSchema,
      this.sealer.aCryptor
    );

    return u8aToHex(this.sealer.sCryptor.getPublicSealingKey()) + '-' +
      u8aToHex(this.sealer.aCryptor.getAuthorKey()) + '-' +
      sealed.public + '-' +
      sealed.private + '-' +
      u8aToHex(SKYEKIWI_VERSION);
  }

  public getCIDList (): IPFSResult[] {
    const cids: IPFSResult[] = [];

    for (const chunksId in this.chunkList) {
      cids.push({
        cid: this.chunkList[chunksId].ipfsCID,
        size: this.chunkList[chunksId].ipfsChunkSize
      } as IPFSResult);
    }

    if (this.chunkListCID) {
      cids.push(this.chunkListCID);
    }

    return cids;
  }

  public static async recoverPreSealData (preSealData: Uint8Array, sCryptor: SCryptor): Promise<PreSealData> {
    if (preSealData.length !== 146) {
      throw new Error('wrong length of pre-sealed data - Metadata.recover');
    }

    const slk = preSealData.slice(0, 32);
    const hash = preSealData.slice(32, 64);
    const author = preSealData.slice(64, 96);
    const version = preSealData.slice(96, 100);
    const chunksCID = u8aToString(preSealData.slice(100));

    const ipfs = new IPFS();
    const encryptedChunks = hexToU8a(await ipfs.cat(chunksCID));

    const _chunks = sCryptor.unsealWithKeys([slk], encryptedChunks);
    const chunks = u8aToString(_chunks).split(' ');

    return {
      author: author,
      chunkCID: chunksCID,
      chunks: chunks,
      hash: hash,
      sealingKey: slk,
      version: version
    };
  }

  public static recoverSealedData (hex: string): SealedData {
    const pieces = hex.split('-');

    return {
      author: hexToU8a(pieces[1]),
      publicSealingKey: hexToU8a(pieces[0]),
      sealed: {
        private: pieces[3],
        public: pieces[2]
      },
      version: hexToU8a(pieces[4])

    };
  }

  public writeChunkResult (config: {
    chunkId: number, rawChunkSize: number, ipfsChunkSize: number, ipfsCID: string
  }): void {
    const { chunkId, ipfsCID, ipfsChunkSize, rawChunkSize } = config;

    if (ipfsCID.length !== 46) {
      throw new Error('IPFS CID Length Err - ChunkMetadata.writeChunkResult');
    }

    if (this.chunkList[chunkId] !== undefined) {
      throw new Error('chunk order err - Metadata.writeChunkResult');
    }

    this.chunkList[chunkId] = {
      ipfsCID: ipfsCID,
      ipfsChunkSize: ipfsChunkSize,
      rawChunkSize: rawChunkSize
    };
  }
}
