// Copyright 2021-2022 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { WriteStream } from 'fs';
import type { Signature } from '@skyekiwi/crypto/types';
import type { IPFSResult } from '@skyekiwi/ipfs/types';
import type { PreSealData } from '@skyekiwi/metadata/types';

import { EncryptionSchema, EthereumSign, Seal, Sealer, SymmetricEncryption } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { IPFS } from '@skyekiwi/ipfs';
import { Metadata, SKYEKIWI_VERSION } from '@skyekiwi/metadata';
import { SecretRegistry } from '@skyekiwi/secret-registry';
import { getLogger, hexToU8a, u8aToHex, u8aToString } from '@skyekiwi/util';

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
    registry: SecretRegistry
  ): Promise<number> {
    const logger = getLogger('Driver.upstream');

    const ipfs = new IPFS();
    const metadata = new Metadata(sealer);

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

    // we are using the Crust Web3 Auth Gateway ... placing Crust orders can be skipped
    // const storageResult = await storage.placeBatchOrderWithCIDList(cidList);
    // logger.info('Crust order placed');

    logger.info('Submitting Crust Order Skipped. Using Crust Web3 Auth Gateway');

    logger.info('writting to registry');
    const res = await registry.registerSecret(result.cid);

    if (!res) {
      throw new Error('packaging works well, blockchain network err - Driver.upstream');
    }

    return res;
  }

  /**
    * the high level upstream API to upstream a contract
    * @param {File} file content to be uploaded
    * @param {Sealer} sealer a collection of sealer functions to be used
    * @param {EncryptionSchema} encryptionSchema blueprint for the secret
    * @param {SecretRegistry} registry secret registry connector to be used
    * @param {string} wasmBlobCID the wasm blob cid of the contract
    * @param {Uint8Array} contractPublicKey the public key of the contract
    * @returns {Promise<void>} None.
  */
  public static async upstreamContract (
    wasmBlob: Uint8Array,
    registry: SecretRegistry,
    initialState?: File,
    sealer?: Sealer,
    encryptionSchema?: EncryptionSchema,
    hasInitialSecretState?: boolean
  ): Promise<number> {
    const logger = getLogger('Driver.upstream');

    const ipfs = new IPFS();
    const wasmFile = await ipfs.add(u8aToHex(wasmBlob));

    await registry.init();

    if (hasInitialSecretState) {
      if (!initialState) {
        throw new Error('initialState is required when hasInitialSecretState is true');
      }

      if (!sealer) {
        throw new Error('sealer is required when hasInitialSecretState is true');
      }

      if (!encryptionSchema) {
        throw new Error('encryptionSchema is required when hasInitialSecretState is true');
      }

      const metadata = new Metadata(sealer);

      let chunkCount = 0;
      const readStream = initialState.getReadStream();

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

      // we are using the Crust Web3 Auth Gateway ... placing Crust orders can be skipped
      // const storageResult = await storage.placeBatchOrderWithCIDList(cidList);
      // logger.info('Crust order placed');

      logger.info('Submitting Crust Order Skipped. Using Crust Web3 Auth Gateway');

      logger.info('writting to registry');
      const res = await registry.registerSecretContract(
        result.cid, wasmFile.cid
      );

      if (!res) {
        throw new Error('packaging works well, blockchain network err - Driver.upstream');
      }

      return res;
    } else {
      const res = await registry.registerSecretContract(
        '0000000000000000000000000000000000000000000000',
        wasmFile.cid
      );

      if (!res) {
        throw new Error('packaging works well, blockchain network err - Driver.upstream');
      }

      return res;
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
    secretId: number,
    registry: SecretRegistry,
    keys: Uint8Array[],
    sealer: Sealer
  ): Promise<PreSealData> {
    const logger = getLogger('Driver.getPreSealDataByVaultId');

    // 1. fetch the IPFS CID of the sealedData from registry
    await registry.init();

    const metadataCID = await registry.getMetadata(secretId);

    logger.info('querying registry success');

    // 2. fetch the sealedData from IPFS
    const ipfs = new IPFS();
    const metadata = Metadata.decodeSealedData(await ipfs.cat(metadataCID));

    logger.info('prase sealed metadata success');

    // 3. recover and decode the sealedData
    const unsealed = Metadata.decodePreSealData(Seal.recover(metadata.sealed, keys, sealer));

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
    secretId: number,
    keys: Uint8Array[],
    registry: SecretRegistry,
    writeStream: WriteStream,
    sealer: Sealer
  ): Promise<void> {
    const logger = getLogger('Driver.downstream');

    logger.info('fetching pre-seal data');
    const unsealed = await this.getPreSealDataByVaultId(secretId, registry, keys, sealer);

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

    const chunksListRaw = u8aToString(SymmetricEncryption.decrypt(sealingKey, hexToU8a(await ipfs.cat(chunks))));
    const chunksList = [];

    for (let offset = 0; offset < chunksListRaw.length; offset += 46) {
      chunksList.push(chunksListRaw.slice(offset, offset + 46));
    }

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
    secretId: number,
    newEncryptionSchema: EncryptionSchema,
    keys: Uint8Array[],
    registry: SecretRegistry,
    sealer: Sealer
  ): Promise<boolean> {
    // 1. get the preSealData from VaultId
    const unsealed = await this.getPreSealDataByVaultId(secretId, registry, keys, sealer);

    // 2. re-seal the data with the new encryptionSchema
    const sealed = Seal.seal(
      Metadata.encodePreSeal(unsealed),
      newEncryptionSchema,
      sealer
    );

    // 3. encode the sealed data
    const sealedMetadata = Metadata.encodeSealedMetadta({
      sealed: sealed,
      version: SKYEKIWI_VERSION
    });

    // 4. upload the updated sealed data and write to the secret registry
    await registry.init();

    const ipfs = new IPFS();
    const result = await ipfs.add(sealedMetadata);

    const res = await registry.updateMetadata(secretId, result.cid);

    return res;
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
    secretId: number,
    keys: Uint8Array[],
    registry: SecretRegistry,
    sealer: Sealer,

    message: Uint8Array
  ): Promise<Signature> {
    const preSealData = await Driver.getPreSealDataByVaultId(secretId, registry, keys, sealer);

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
