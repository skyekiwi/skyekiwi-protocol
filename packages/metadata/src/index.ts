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

  /**
   * Constructor of a Metadata handler
   * @constructor
   * @param {Sealer} sealer define the Sealer used for encryption
   * @param {Uint8Array} [sealingKey] optional pre-defined sealingKey. Not recommanded to be used for security.
  */
  constructor (sealer: Sealer, sealingKey?: Uint8Array) {
    this.#chunkList = {};

    this.#sealer = sealer;

    // if no secretBoxKey supplied, generate a random key
    this.#sealingKey = sealingKey || randomBytes(32);

    if (this.#sealingKey.length !== 32) {
      throw new Error('sealingKey length error - Metadata.constructor');
    }
  }

  /**
    * encrypt a chunk with the #sealingKey
    * @param {Uint8Array} chunk the chunk to be encrypted
    * @returns {Uint8Array} the encrypted chunk with leading nonce
  */
  public encryptChunk (chunk: Uint8Array): Uint8Array {
    return SymmetricEncryption.encrypt(this.#sealingKey, chunk);
  }

  /**
    * encrypt and upload a list of all chunk CIDs to IPFS
    * @returns {void} None. The result will be written to this.#chunkListCID
  */
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

  /**
    * generate the preSeal metadata
    * @returns {Uint8Array} return the packed preSeal metadata
  */
  public generatePreSealMetadata (): Uint8Array {
    return Metadata.encodePreSeal({
      chunkCID: this.#chunkListCID.cid,
      hash: this.hash,
      sealingKey: this.#sealingKey,
      version: SKYEKIWI_VERSION
    });
  }

  /**
    * generate the sealed metadata
    * @param {EncryptionSchema} encryptionSchema the blueprint of the secret
    * @returns {string} return the packed sealed metadata
  */
  public async generateSealedMetadata (encryptionSchema: EncryptionSchema): Promise<string> {
    // 1. encrypt and upload a list of all CIDs of chunks
    await this.uploadCIDList();

    // 2. pack the preSeal metadata
    const preSealData = this.generatePreSealMetadata();

    // sanity check
    if (preSealData.length !== 114) {
      throw new Error('pre-seal data len error - Metadata.generateSealedMetadata');
    }

    // 3. seal the preSeal data with the encryptionSchema
    const sealed = Seal.seal(
      preSealData,
      encryptionSchema,
      this.#sealer
    );

    // 4. pack the sealed data
    return Metadata.encodeSealedMetadta({
      publicSealingKey: AsymmetricEncryption.getPublicKey(this.#sealingKey),
      sealed: sealed,
      version: SKYEKIWI_VERSION
    });
  }

  /**
    * get a list of CIDs of chunks
    * @returns {IPFSResult[]} the list of CIDs of all chunks
  */
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

  /**
    * decode the preSealData
    * @returns {PreSealData} the decoded PreSealData
  */
  public static decodePreSealData (preSealData: Uint8Array): PreSealData {
    if (preSealData.length !== 114) {
      throw new Error('wrong length of pre-sealed data - Metadata.recover');
    }

    const chunkCID = u8aToString(preSealData.slice(0, 46));
    const hash = preSealData.slice(46, 78);
    const slk = preSealData.slice(78, 110);
    const version = preSealData.slice(110);

    return {
      chunkCID: chunkCID,
      hash: hash,
      sealingKey: slk,
      version: version
    };
  }

  /**
    * decode an encoded SealedMetadata
    * @returns {SealedMetadata} the decoded SealedMetadata
  */
  public static decodeSealedData (hex: string): SealedMetadata {
    const pieces = hex.split('-');

    if (pieces.length !== 4) {
      throw new Error('invalid sealed data - Metadata.recoverSealedData');
    }

    return {
      publicSealingKey: hexToU8a(pieces[0]),
      sealed: {
        private: pieces[1],
        public: pieces[2]
      },
      version: hexToU8a(pieces[3])
    };
  }

  /**
    * write the result of one chunk to the Metadata handler
    * @param {number} chunkId sequencing of the chunk
    * @param {number} rawChunkSize the size of the chunk before encryption and uploading
    * @param {number} ipfsChunkSize the size of the encrypted chunk size; based on IPFS result
    * @param {string} ipfsCID the IPFS CID of the chunk
  */
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

  /**
    * encode an raw PreSealData
    * @returns {Uint8Array} the encoded PreSealData
  */
  public static encodePreSeal (preSeal: PreSealData): Uint8Array {
    const result = new Uint8Array(
      // sealingKey, hash
      32 * 2 +
      // skyekiwi version
      4 +
      // an IPFS CID in binary
      46
    );

    // verify all fields are valid
    if (
      !(stringToU8a(preSeal.chunkCID).length === 46) ||
      !(preSeal.hash.length === 32) ||
      !(preSeal.sealingKey.length === 32) ||
      !(SKYEKIWI_VERSION.length === 4)
    ) {
      throw new Error('pre-sealing error - Metadata.getPreSealData');
    }

    result.set(stringToU8a(preSeal.chunkCID), 0);
    result.set(preSeal.hash, 46);
    result.set(preSeal.sealingKey, 78);
    result.set(SKYEKIWI_VERSION, 110);

    return result;
  }

  /**
    * encode an raw SealedMetadata
    * @returns {string} the encoded SealedMetadata
  */
  public static encodeSealedMetadta (sealedData: SealedMetadata): string {
    return `${u8aToHex(sealedData.publicSealingKey)}-${sealedData.sealed.private}-${sealedData.sealed.public}-${u8aToHex(sealedData.version)}`;
  }
}
