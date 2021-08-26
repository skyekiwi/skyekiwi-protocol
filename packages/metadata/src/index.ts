// Copyright 2021 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IPFSResult } from '@skyekiwi/ipfs/types';
import type { ChunkList, PreSealData, SealedMetadata } from './types';

import { randomBytes } from 'tweetnacl';

import { AsymmetricEncryption, EncryptionSchema, Seal, Sealer, SymmetricEncryption } from '@skyekiwi/crypto';
import { IPFS } from '@skyekiwi/ipfs';
import { hexToU8a, stringToU8a, trimEnding, u8aToHex, u8aToString } from '@skyekiwi/util';

// version code in Uint8Array
export const SKYEKIWI_VERSION = new Uint8Array([0, 0, 0, 1]);

export class Metadata {
  #sealingKey: Uint8Array;
  #sealer: Sealer
  #chunkList: ChunkList
  #chunkListCID: IPFSResult

  public hash: Uint8Array

  constructor (sealer: Sealer, sealingKey?: Uint8Array) {
    this.#chunkList = {};

    this.#sealer = sealer;

    // if no secretBoxKey supplied, generate a random key
    this.#sealingKey = sealingKey || randomBytes(32);

    if (this.#sealingKey.length !== 32) {
      throw new Error('sealingKey length error - Metadata.constructor');
    }
  }

  public encryptChunk (chunk: Uint8Array): Uint8Array {
    return SymmetricEncryption.encrypt(this.#sealingKey, chunk);
  }

  public async uploadCIDList (): Promise<void> {
    let chunk = '';

    for (const chunksId in this.#chunkList) {
      // 46 char
      chunk += this.#chunkList[chunksId].ipfsCID;

      // 1 char divider
      chunk += '-';
    }

    const encryptedChunk = u8aToHex(SymmetricEncryption.encrypt(this.#sealingKey, stringToU8a(trimEnding(chunk))));

    const ipfs = new IPFS();
    const cid = await ipfs.add(encryptedChunk);

    this.#chunkListCID = {
      cid: cid.cid.toString(),
      size: cid.size
    };
  }

  public generatePreSealMetadata (): Uint8Array {
    return Metadata.packagePreSeal({
      author: this.#sealer.getAuthorKey(),
      chunkCID: this.#chunkListCID.cid,
      hash: this.hash,
      sealingKey: this.#sealingKey,
      version: SKYEKIWI_VERSION
    });
  }

  public async generateSealedMetadata (encryptionSchema: EncryptionSchema): Promise<string> {
    await this.uploadCIDList();
    const preSealData = this.generatePreSealMetadata();

    if (preSealData.length !== 146) {
      throw new Error('pre-seal data len error - Metadata.generateSealedMetadata');
    }

    const sealed = Seal.seal(
      preSealData,
      encryptionSchema,
      this.#sealer
    );

    return Metadata.packageSealedMetadta({
      author: this.#sealer.getAuthorKey(),
      publicSealingKey: AsymmetricEncryption.getPublicKey(this.#sealingKey),
      sealed: sealed,
      version: SKYEKIWI_VERSION
    });
  }

  public getCIDList (): IPFSResult[] {
    const cids: IPFSResult[] = [];

    for (const chunksId in this.#chunkList) {
      cids.push({
        cid: this.#chunkList[chunksId].ipfsCID,
        size: this.#chunkList[chunksId].ipfsChunkSize
      } as IPFSResult);
    }

    if (this.#chunkListCID) {
      cids.push(this.#chunkListCID);
    }

    return cids;
  }

  public static recoverPreSealData (preSealData: Uint8Array): PreSealData {
    if (preSealData.length !== 146) {
      throw new Error('wrong length of pre-sealed data - Metadata.recover');
    }

    const author = preSealData.slice(0, 32);
    const chunkCID = u8aToString(preSealData.slice(32, 78));
    const hash = preSealData.slice(78, 110);
    const slk = preSealData.slice(110, 142);
    const version = preSealData.slice(142);

    return {
      author: author,
      chunkCID: chunkCID,
      hash: hash,
      sealingKey: slk,
      version: version
    };
  }

  public static recoverSealedData (hex: string): SealedMetadata {
    const pieces = hex.split('-');

    if (pieces.length !== 5) {
      throw new Error('invalid sealed data - Metadata.recoverSealedData');
    }

    return {
      author: hexToU8a(pieces[0]),
      publicSealingKey: hexToU8a(pieces[1]),
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

    if (this.#chunkList[chunkId] !== undefined) {
      throw new Error('chunk order err - Metadata.writeChunkResult');
    }

    this.#chunkList[chunkId] = {
      ipfsCID: ipfsCID,
      ipfsChunkSize: ipfsChunkSize,
      rawChunkSize: rawChunkSize
    };
  }

  public static packagePreSeal (preSeal: PreSealData): Uint8Array {
    const result = new Uint8Array(
      // sealingKey, hash, Author
      32 * 3 +
      // skyekiwi version
      4 +
      // an IPFS CID in binary
      46
    );

    if (
      !(preSeal.author.length === 32) ||
      !(stringToU8a(preSeal.chunkCID).length === 46) ||
      !(preSeal.hash.length === 32) ||
      !(preSeal.sealingKey.length === 32) ||
      !(SKYEKIWI_VERSION.length === 4)
    ) {
      throw new Error('pre-sealing error - Metadata.getPreSealData');
    }

    result.set(preSeal.author, 0);
    result.set(stringToU8a(preSeal.chunkCID), 32);
    result.set(preSeal.hash, 78);
    result.set(preSeal.sealingKey, 110);
    result.set(SKYEKIWI_VERSION, 142);

    return result;
  }

  public static packageSealedMetadta (sealedData: SealedMetadata): string {
    return `${u8aToHex(sealedData.author)}-${u8aToHex(sealedData.publicSealingKey)}-${sealedData.sealed.public}-${sealedData.sealed.private}-${u8aToHex(sealedData.version)}`;
  }
}
