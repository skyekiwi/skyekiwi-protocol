// Copyright 2021 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AnyJson } from '@polkadot/types/types';
import type { WriteStream } from 'fs';
import type { Signature } from '@skyekiwi/crypto/types';
import type { IPFSResult } from '@skyekiwi/ipfs/types';
import type { PreSealData } from '@skyekiwi/metadata/types';

import { Crust } from '@skyekiwi/crust-network';
import { AsymmetricEncryption, EncryptionSchema, EthereumSign, Seal, Sealer, SymmetricEncryption } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { IPFS } from '@skyekiwi/ipfs';
import { Metadata, SKYEKIWI_VERSION } from '@skyekiwi/metadata';
import { getLogger, hexToU8a, u8aToHex, u8aToString } from '@skyekiwi/util';
import { WASMContract } from '@skyekiwi/wasm-contract';

export class Driver {
  /**
    * the high level upstream API to upstream a content
    * @param {File} file content to be uploaded
    * @param {Sealer} sealer a collection of sealer functions to be used
    * @param {EncryptionSchema} encryptionSchema blueprint for the secret
    * @param {Crust} storage storage blockchain network connector
    * @param {WASMContract} registry secret registry connector to be used
    * @returns {Promise<void>} None.
  */
  public static async upstream (
    file: File,
    sealer: Sealer,
    encryptionSchema: EncryptionSchema,
    storage: Crust,
    registry: WASMContract
  ): Promise<AnyJson> {
    const logger = getLogger('Driver.upstream');

    const ipfs = new IPFS();
    const metadata = new Metadata(sealer);

    await storage.init();
    await registry.init();

    let chunkCount = 0;
    const readStream = file.getReadStream();

    logger.info('initiating chunk processing pipeline');

    // main loop - the main upstreaming pipeline
    for await (const chunk of readStream) {
      await Driver.upstreamChunkProcessingPipeLine(
        metadata, chunk, chunkCount++
      );
    }

    const cidList: IPFSResult[] = metadata.getCIDList();

    logger.info('CID List extraction success');

    const sealedData: string = await metadata.generateSealedMetadata(encryptionSchema);

    logger.info('file metadata sealed');

    const result = await ipfs.add(sealedData);

    logger.info('sealed metadata uploaded to IPFS');

    cidList.push({
      cid: result.cid,
      size: result.size
    });

    const storageResult = await storage.placeBatchOrderWithCIDList(cidList);

    logger.info('Crust order placed');

    if (storageResult) {
      logger.info('writting to registry');
      const res = await registry.execContract('createVault', [result.cid]);

      return res;
    } else {
      throw new Error('packaging works well, blockchain network err - Driver.upstream');
    }
  }

  /**
    * upstream helper - pipeline to process each chunk
    * @param {Metadata} metadata an Metadata handler instance
    * @param {Uint8Array} chunk chunk to be processed
    * @param {number} chunkId sequencing number of the current chunk
    * @returns {Promise<void>} None.
  */
  private static async upstreamChunkProcessingPipeLine (
    metadata: Metadata, chunk: Uint8Array, chunkId: number
  ): Promise<void> {
    const logger = getLogger('Driver.upstreamChunkProcessingPipeLine');

    logger.info(`processing chunk ${chunkId}`);

    // 0. get raw chunk size
    const rawChunkSize = chunk.length;

    // 1. get hash, if this is the first chunk, get the hash
    //          else, get hash combined with last hash
    if (metadata.hash === undefined) {
      metadata.hash = await File.getChunkHash(chunk);
    } else {
      metadata.hash = await File.getCombinedChunkHash(
        metadata.hash, chunk
      );
    }

    logger.info(`computing hash success for ${chunkId}`);

    // 2. deflate the chunk
    chunk = File.deflateChunk(chunk);
    logger.info(`deflating chunk success for ${chunkId}`);

    // 3. SecretBox encryption
    chunk = metadata.encryptChunk(chunk);
    logger.info(`chunk encryption success for ${chunkId}`);

    // 4. upload to IPFS
    const ipfs = new IPFS();
    const IPFS_CID = await ipfs.add(u8aToHex(chunk));

    logger.info(`chunk uploaded to ipfs for ${chunkId}`);

    // 5. write to chunkMetadata
    metadata.writeChunkResult({
      chunkId: chunkId,
      ipfsCID: IPFS_CID.cid.toString(),
      ipfsChunkSize: IPFS_CID.size,
      rawChunkSize: rawChunkSize
    });
    logger.info(`chunk metadata stored for ${chunkId}`);
  }

  /**
    * fetch data from the secret registry and unseal the SealedData
    * @param {number} vaultId the vaultId from the secret registry
    * @param {WASMContract} registry connector to the blockchain secret registry
    * @param {Uint8Array[]} keys all keys the user has access to; used to decrypt the shares
    * @param {Sealer} sealer sealer functions used to decrypt the shares
    * @returns {Promise<PreSealData>} the decrypted & recovered PreSealData
  */
  public static async getPreSealDataByVaultId (
    vaultId: number,
    registry: WASMContract,
    keys: Uint8Array[],
    sealer: Sealer
  ): Promise<PreSealData> {
    const logger = getLogger('Driver.getPreSealDataByVaultId');

    // 1. fetch the IPFS CID of the sealedData from registry
    await registry.init();

    /* eslint-disable */
    //@ts-ignore
    const contractResult = (await registry.queryContract('getMetadata', [vaultId])).output.toString();
    /* eslint-enable */

    logger.info('querying registry success');

    // 2. fetch the sealedData from IPFS
    const ipfs = new IPFS();
    const metadata = Metadata.decodeSealedData(await ipfs.cat(contractResult));

    logger.info('unseal metadata success');

    // 3. recover and decode the sealedData
    const unsealed = Metadata.decodePreSealData(
      Seal.recover(
        {
          private: metadata.sealed.private,
          public: metadata.sealed.public
        },
        keys, sealer
      )
    );

    logger.info('pre-seal data recovered');

    return unsealed;
  }

  /**
    * high level downstream API
    * @param {number} vaultId the vaultId from the secret registry
    * @param {Uint8Array[]} keys all keys the user has access to; used to decrypt the shares
    * @param {WASMContract} registry connector to the blockchain secret registry
    * @param {WriteSteram} writeStream output writeStream
    * @param {Sealer} sealer sealer functions used to decrypt the shares
    * @returns {Promise<void>} None.
  */
  public static async downstream (
    vaultId: number,
    keys: Uint8Array[],
    registry: WASMContract,
    writeStream: WriteStream,
    sealer: Sealer
  ): Promise<void> {
    const logger = getLogger('Driver.downstream');

    logger.info('fetching pre-seal data');
    const unsealed = await this.getPreSealDataByVaultId(vaultId, registry, keys, sealer);

    logger.info('entering downstream processing pipeline');

    await this.downstreamChunkProcessingPipeLine(
      unsealed.chunkCID,
      unsealed.hash,
      unsealed.sealingKey,
      writeStream
    );
  }

  /**
    * downstream API helper
    * @param {string} chunks the encrypted list of all CIDs of chunks
    * @param {Uint8Array} hash hash of all chunks; used for verification
    * @param {Uint8Array} sealingKey sealingKey used to decrypt the files
    * @param {WriteSteram} writeStream output writeStream
    * @returns {Promise<void>} None.
  */
  private static async downstreamChunkProcessingPipeLine (
    chunks: string,
    hash: Uint8Array,
    sealingKey: Uint8Array,
    writeStream: WriteStream
  ): Promise<void> {
    const logger = getLogger('Driver.downstream');

    const ipfs = new IPFS();

    const chunksList = u8aToString(SymmetricEncryption.decrypt(sealingKey, hexToU8a(await ipfs.cat(chunks)))).split('-');

    logger.info('chunkList recovery successful');

    let currentHash: Uint8Array;

    for (const chunkCID of chunksList) {
      logger.info(`downstreaming chunk ${chunkCID}`);
      const chunk = File.inflatDeflatedChunk(SymmetricEncryption.decrypt(sealingKey, hexToU8a(await ipfs.cat(chunkCID))));

      logger.info(`downstreaming chunk ${chunkCID} success`);

      if (currentHash === undefined) {
        currentHash = await File.getChunkHash(chunk);
      } else {
        currentHash = await File.getCombinedChunkHash(currentHash, chunk);
      }

      logger.info('writting to file');

      writeStream.write(chunk);
    }

    if (u8aToHex(currentHash) !== u8aToHex(hash)) {
      throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine');
    }
  }

  /**
    * high level API to update the encryption schema of a secret without changing the content
    * @param {number} vaultId the vaultId from the secret registry
    * @param {EncryptionSchema} newEncryptionSchema the new encryptionSchema
    * @param {Uint8Array[]} keys all keys the user has access to; used to decrypt the shares
    * @param {Crust} storage storage network connector
    * @param {WASMContract} registry connector to the blockchain secret registry
    * @param {Sealer} sealer sealer functions used to decrypt the shares
    * @returns {Promise<void>} None.
  */
  public static async updateEncryptionSchema (
    vaultId: number,
    newEncryptionSchema: EncryptionSchema,
    keys: Uint8Array[],
    storage: Crust,
    registry: WASMContract,
    sealer: Sealer
  ): Promise<AnyJson> {
    // 1. get the preSealData from VaultId
    const unsealed = await this.getPreSealDataByVaultId(vaultId, registry, keys, sealer);

    // 2. re-seal the data with the new encryptionSchema
    const sealed = Seal.seal(
      Metadata.encodePreSeal(unsealed),
      newEncryptionSchema,
      sealer
    );

    // 3. encode the sealed data
    const sealedMetadata = Metadata.encodeSealedMetadta({
      publicSealingKey: AsymmetricEncryption.getPublicKey(unsealed.sealingKey),
      sealed: sealed,
      version: SKYEKIWI_VERSION
    });

    // 4. upload the updated sealed data and write to the secret registry
    await storage.init();
    await registry.init();

    const ipfs = new IPFS();
    const result = await ipfs.add(sealedMetadata);
    const cidList = [{
      cid: result.cid.toString(),
      size: result.size
    }];

    const storageResult = await storage.placeBatchOrderWithCIDList(cidList);

    if (storageResult) {
      const res = await registry.execContract('updateMetadata', [vaultId, result.cid]);

      return res;
    } else {
      throw new Error('packaging works well, blockchain network err - Driver.upstream');
    }
  }

  /**
    * generate a proof of access from the signature derived from the sealingKey
    * @param {number} vaultId the vaultId from the secret registry
    * @param {Uint8Array[]} keys all keys the user has access to; used to decrypt the shares
    * @param {WASMContract} registry connector to the blockchain secret registry
    * @param {Sealer} sealer sealer functions used to decrypt the shares
    * @param {Uint8Array} message message to be signed; no need to be hashed
    * @returns {Promise<Signature>} the proof generated
  */
  public static async generateProofOfAccess (
    vaultId: number,
    keys: Uint8Array[],
    registry: WASMContract,
    sealer: Sealer,

    message: Uint8Array
  ): Promise<Signature> {
    const preSealData = await Driver.getPreSealDataByVaultId(vaultId, registry, keys, sealer);

    const signer = new EthereumSign();

    const res = await signer.generateSignature(preSealData.sealingKey, message);

    return res;
  }

  /**
    * offline verify a proof of access
    * @param {Signature} signature signature generated by generateProofOfAccess
    * @returns {boolean} the validity of the signature
  */
  public static verifyProofOfAccess (signature: Signature): boolean {
    const signer = new EthereumSign();

    return signer.verifySignature(signature);
  }
}
