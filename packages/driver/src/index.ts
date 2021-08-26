// Copyright 2021 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { WriteStream } from 'fs';
import type { IPFSResult } from '@skyekiwi/ipfs/types';
import type { PreSealData } from '@skyekiwi/metadata/types';

import { Crust } from '@skyekiwi/crust-network';
import { AsymmetricEncryption, EncryptionSchema, Seal, Sealer, SymmetricEncryption } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { IPFS } from '@skyekiwi/ipfs';
import { Metadata, SKYEKIWI_VERSION } from '@skyekiwi/metadata';
import { hexToU8a, u8aToHex, u8aToString } from '@skyekiwi/util';
import { WASMContract } from '@skyekiwi/wasm-contract';

export class Driver {
  public static async upstream (
    file: File,
    sealer: Sealer,
    encryptionSchema: EncryptionSchema,
    storage: Crust,
    registry: WASMContract
  ) {
    const ipfs = new IPFS();
    const metadata = new Metadata(sealer);

    await storage.init();
    await registry.init();

    let chunkCount = 0;
    const readStream = file.getReadStream();

    for await (const chunk of readStream) {
      await Driver.upstreamChunkProcessingPipeLine(
        metadata, chunk, chunkCount++
      );
    }

    const cidList: IPFSResult[] = metadata.getCIDList();
    const sealedData: string = await metadata.generateSealedMetadata(encryptionSchema);

    const result = await ipfs.add(sealedData);

    cidList.push({
      cid: result.cid,
      size: result.size
    });

    const storageResult = await storage.placeBatchOrderWithCIDList(cidList);

    if (storageResult) {
      return await registry.execContract('createVault', [result.cid]);
    } else {
      throw new Error('packaging works well, blockchain network err - Driver.upstream');
    }
  }

  private static async upstreamChunkProcessingPipeLine (
    metadata: Metadata, chunk: Uint8Array, chunkId: number
  ): Promise<void> {
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

    // 2. deflate the chunk
    chunk = File.deflateChunk(chunk);

    // 3. SecretBox encryption
    chunk = metadata.encryptChunk(chunk);

    // 4. upload to IPFS
    const ipfs = new IPFS();
    const IPFS_CID = await ipfs.add(u8aToHex(chunk));

    // 5. write to chunkMetadata
    metadata.writeChunkResult({
      chunkId: chunkId,
      ipfsCID: IPFS_CID.cid.toString(),
      ipfsChunkSize: IPFS_CID.size,
      rawChunkSize: rawChunkSize
    });
  }

  public static async getPreSealDataByVaultId (
    vaultId: number,
    registry: WASMContract,
    keys: Uint8Array[],
    sealer: Sealer
  ): Promise<PreSealData> {
    await registry.init();
    const contractResult = (await registry
      .queryContract('getMetadata', [vaultId])
    ).output.toString();

    const ipfs = new IPFS();
    const metadata = Metadata.recoverSealedData(await ipfs.cat(contractResult));

    const unsealed = Metadata.recoverPreSealData(
      Seal.recover(
        {
          private: metadata.sealed.private,
          public: metadata.sealed.public
        },
        keys, metadata.author, sealer
      )
    );

    return unsealed;
  }

  public static async downstream (
    vaultId: number,
    keys: Uint8Array[],
    registry: WASMContract,
    writeStream: WriteStream,
    sealer: Sealer
  ): Promise<void> {
    const unsealed = await this.getPreSealDataByVaultId(vaultId, registry, keys, sealer);

    return await this.downstreamChunkProcessingPipeLine(
      unsealed.chunkCID,
      unsealed.hash,
      unsealed.sealingKey,
      writeStream
    );
  }

  private static async downstreamChunkProcessingPipeLine (
    chunks: string,
    hash: Uint8Array,
    sealingKey: Uint8Array,
    writeStream: WriteStream
  ): Promise<void> {
    const ipfs = new IPFS();

    const chunksList = u8aToString(SymmetricEncryption.decrypt(sealingKey, hexToU8a(await ipfs.cat(chunks)))).split('-');

    let currentHash: Uint8Array;

    for (const chunkCID of chunksList) {
      const chunk = File.inflatDeflatedChunk(SymmetricEncryption.decrypt(sealingKey, hexToU8a(await ipfs.cat(chunkCID))));

      if (currentHash === undefined) {
        currentHash = await File.getChunkHash(chunk);
      } else {
        currentHash = await File.getCombinedChunkHash(currentHash, chunk);
      }

      writeStream.write(chunk);
    }

    if (u8aToHex(currentHash) !== u8aToHex(hash)) {
      throw new Error('file hash does not match: Driver.downstreamChunkProcessingPipeLine');
    }
  }

  public static async updateEncryptionSchema (
    vaultId: number,
    newEncryptionSchema: EncryptionSchema,
    keys: Uint8Array[],
    storage: Crust,
    registry: WASMContract,
    sealer: Sealer
  ) {
    const unsealed = await this.getPreSealDataByVaultId(vaultId, registry, keys, sealer);

    unsealed.author = sealer.getAuthorKey();

    const sealed = Seal.seal(
      Metadata.packagePreSeal(unsealed),
      newEncryptionSchema,
      sealer
    );

    const sealedMetadata = Metadata.packageSealedMetadta({
      author: sealer.getAuthorKey(),
      publicSealingKey: AsymmetricEncryption.getPublicKey(unsealed.sealingKey),
      sealed: sealed,
      version: SKYEKIWI_VERSION
    });

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
      return await registry.execContract('updateMetadata', [vaultId, result.cid]);
    } else {
      throw new Error('packaging works well, blockchain network err - Driver.upstream');
    }
  }
}
