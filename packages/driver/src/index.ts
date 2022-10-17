// Copyright 2021-2022 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { CombinedCipher, PublicKey, SecretKey } from '@skyekiwi/crypto/types';

import { EventEmitter } from 'events';
import tweetnacl from 'tweetnacl';

import { Cipher, sha256Hash, SymmetricEncryption } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { IPFS } from '@skyekiwi/ipfs';
import { IPFSResult } from '@skyekiwi/ipfs/types';
import { PreSealed, Sealed } from '@skyekiwi/metadata';
import { hexToU8a, stringToU8a, u8aToHex, u8aToString } from '@skyekiwi/util';

import { progressText } from './progress';

export class Driver {
  // Upstream
  /**
    * generate pre sealed data from file or buffer
    * @param {File | Uint8Array} file content to be uploaded
    * @param {EventEmitter} progress (optional) event emitter for progress
    * @returns {Promise<Uint8Array>} serialized PreSealed data
  */
  public static async generatePreSealedData (
    file: File | Uint8Array,
    progress?: EventEmitter
  ): Promise<PreSealed> {
    const cidList: IPFSResult[] = [];
    const hashes: Uint8Array[] = [];
    const sealingKey: Uint8Array = tweetnacl.randomBytes(32);

    let chunkCount = 0;

    if (progress) progress.emit('progress', 'GENERATE_PRESEALED_DATA_INIT', null);

    if (file instanceof File) {
      const readStream = file.getReadStream();

      // main loop - the main upstreaming pipeline
      for await (const chunk of readStream) {
        const [cid, hash] = await Driver.upstreamChunkProcessingPipeLine(chunk, sealingKey, chunkCount++, progress);

        cidList.push(cid); hashes.push(hash);
      }
    } else {
      const [cid, hash] = await Driver.upstreamChunkProcessingPipeLine(file, sealingKey, chunkCount++, progress);

      cidList.push(cid); hashes.push(hash);
    }

    if (progress) progress.emit('progress', 'GENERATE_PRESEALED_DATA_UPSTREAM_SUCCESS', null);

    const cids = cidList.reduce((res, c): string => {
      res += c.cid;

      return res;
    }, '');
    const encryptedCIDs = u8aToHex(SymmetricEncryption.encrypt(sealingKey, stringToU8a(cids)));
    const cid = await IPFS.add(encryptedCIDs);

    if (progress) progress.emit('progress', 'GENERATE_PRESEALED_DATA_UPLOAD_CID_LIST_SUCCESS', null);

    const hash = hashes.reduce((p, c) => {
      const t = new Uint8Array(64);

      t.set(p, 0);
      t.set(c, 32);

      return sha256Hash(t);
    }, new Uint8Array(32));

    return new PreSealed({
      chunkCID: cid.cid, hash, sealingKey
    });
  }

  /**
    * upstream helper - pipeline to process each chunk
    * @param {Uint8Array} chunk chunk to be processed
    * @param {Uint8Array} sealingKey sealingKey used for encryption
    * @param {number} chunkId sequencing number of the current chunk
    * @param {EventEmitter} progress (optional) event emitter for progress
    * @returns {Promise<[IPFSResult, Uint8Array]>} resulting IPFS cid & file hash
  */
  private static async upstreamChunkProcessingPipeLine (
    chunk: Uint8Array, sealingKey: Uint8Array, chunkId: number, progress?: EventEmitter
  ): Promise<[IPFSResult, Uint8Array]> {
    if (sealingKey.length !== 32) {
      throw new Error('wrong sealingKey size - Driver.upstreamChunkProcessingPipeLine');
    }

    if (progress) progress.emit('progress', 'UPSTREAM_PROCESSING_CHUNK', chunkId);

    // 1. get hash, if this is the first chunk, get the hash
    //          else, get hash combined with last hash
    const hash = File.getChunkHash(chunk);

    if (progress) progress.emit('progress', 'UPSTREAM_COMPUTING_HASH_SUCCESS', chunkId);

    // 2. deflate the chunk
    chunk = File.deflateChunk(chunk);
    if (progress) progress.emit('progress', 'UPSTREAM_DEFLATE_CHUNK_SUCCESS', chunkId);

    // 3. SecretBox encryption
    chunk = SymmetricEncryption.encrypt(sealingKey, chunk);
    if (progress) progress.emit('progress', 'UPSTREAM_ENCRYPT_CHUNK_SUCCESS', chunkId);

    if (progress) progress.emit('progress', 'UPSTREAM_ENCRYPT_CHUNK_SUCCESS', chunkId);
    // 4. upload to IPFS
    const ipfsCid = await IPFS.add(u8aToHex(chunk));

    if (progress) progress.emit('progress', 'UPSTREAM_UPLOADING_IPFS_SUCCESS', chunkId);

    return [ipfsCid, hash];
  }

  /**
    * seal the PreSealed data
    * @param {PreSealed} preSealed the PreSealed data to seal
    * @param {PublicKey[]} receipients receipients of the sealed data
    * @param {boolean} isPublic or not do we wanna encrypt
    * @param {EventEmitter} progress (optional) event emitter for progress
    * @returns {Promise<[IPFSResult, Uint8Array]>} resulting IPFS cid & file hash
  */
  public static generateSealedData (
    preSealed: PreSealed, receipients: PublicKey[], isPublic: boolean,
    progress?: EventEmitter
  ): Sealed {
    const cipher = isPublic
      ? { bytes: preSealed.serialize(), dataLength: 0 } as CombinedCipher
      : Cipher.build(preSealed.serialize(), receipients);

    if (progress) progress.emit('progress', 'GENERATE_PRESEALED_DATA_INIT', null);

    return new Sealed({ cipher, isPublic: isPublic });
  }

  // Downstream
  /**
    * recover PreSealed data from Sealed
    * @param {Sealed} sealed the Sealed data to unseal
    * @param {SecretKey[]} keys private keys of the receipient
    * @param {EventEmitter} progress (optional) event emitter for progress
    * @returns {PreSealed} resulting PreSealed data
  */
  public static recoverFromSealedData (
    sealed: Sealed, keys: SecretKey[], progress?: EventEmitter
  ): PreSealed {
    const preSealedBytes = Cipher.parseWithKeys(sealed.cipher, keys);

    if (progress) progress.emit('progress', 'RECOVER_FROM_SEALED_DATA_UNSEALING_SUCCESS', null);

    return PreSealed.deserialize(preSealedBytes);
  }

  /**
    * recover file from PreSealed data
    * @param {PreSealed} preSealed the PreSealed data to recover
    * @param {Function} write callback function, receive Uint8Array as the current chunk
    * @param {EventEmitter} progress (optional) event emitter for progress
    * @returns {Promise<void>} None.
  */
  public static async recoverFileFromPreSealedData (
    preSealed: PreSealed,
    write: (chunk: Uint8Array) => void,
    progress?: EventEmitter
  ): Promise<void> {
    if (progress) progress.emit('progress', 'RECOVER_FILE_FROM_PRESEALED_DATA_INIT', null);

    const chunksListRaw = u8aToString(
      SymmetricEncryption.decrypt(
        preSealed.sealingKey,
        hexToU8a(await IPFS.cat(preSealed.chunkCID))
      )
    );

    const chunksList = [];

    for (let offset = 0; offset < chunksListRaw.length; offset += 46) {
      chunksList.push(chunksListRaw.slice(offset, offset + 46));
    }

    const hashes = [];
    let chunkId = 0;

    for (const chunkCID of chunksList) {
      if (progress) progress.emit('progress', 'RECOVER_FILE_FROM_PRESEALED_DATA_DOWNLOAD_CHUNK', chunkId);
      const chunk = File.inflatDeflatedChunk(SymmetricEncryption.decrypt(preSealed.sealingKey, hexToU8a(await IPFS.cat(chunkCID))));

      if (progress) progress.emit('progress', 'RECOVER_FILE_FROM_PRESEALED_DATA_DOWNLOAD_CHUNK_SUCCESS', chunkId);
      hashes.push(File.getChunkHash(chunk));
      if (progress) progress.emit('progress', 'RECOVER_FILE_FROM_PRESEALED_DATA_WRITE_CHUNK_DATA', chunkId);
      write(chunk);
      chunkId++;
    }

    const hash = hashes.reduce((p, c) => {
      const t = new Uint8Array(64);

      t.set(p, 0);
      t.set(c, 32);

      return sha256Hash(t);
    }, new Uint8Array(32));

    if (u8aToHex(hash) !== u8aToHex(preSealed.hash)) {
      throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine');
    }
  }

  public static reEncryption (
    sealed: Sealed, keys: SecretKey[], newReceipients: PublicKey[]
  ): Sealed {
    const preSealed = Driver.recoverFromSealedData(sealed, keys);
    const newSealed = Driver.generateSealedData(preSealed, newReceipients, sealed.isPublic);

    return Sealed.combineSealedData(sealed, newSealed);
  }
}

export { progressText };
