// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SContractConfiguration } from './types';

import { mnemonicToMiniSecret } from '@polkadot/util-crypto';
import fs from 'fs';

import { Crust } from '@skyekiwi/crust-network';
import { DefaultSealer, EncryptionSchema } from '@skyekiwi/crypto';
import { Driver } from '@skyekiwi/driver';
import { File } from '@skyekiwi/file';
import { IPFS } from '@skyekiwi/ipfs';
import { stringToIndex } from '@skyekiwi/util';
import { WASMContract } from '@skyekiwi/wasm-contract';

import abi from '../fixtures/skyekiwi';
import types from '../fixtures/types';
import { SContractReader } from './reader';

/* eslint-disable */
require('dotenv').config();
/* eslint-enable */

export class SContractPersistent {
  public static async initialize (config: SContractConfiguration, contractId: string, wasmBlobCID: string): Promise<SContractReader> {
    if (!process.env.SEED_PHRASE) {
      throw new Error('seed phrase not found, aborting - s-contract/initialize');
    }

    const outputPath = `${config.localStoragePath}`;
    const sealer = new DefaultSealer();
    const registry = new WASMContract(process.env.SEED_PHRASE, types, abi, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg');

    sealer.unlock(mnemonicToMiniSecret(process.env.SEED_PHRASE));

    await Driver.downstream(
      stringToIndex(contractId), [mnemonicToMiniSecret(process.env.SEED_PHRASE)], registry,
      fs.createWriteStream(outputPath + `${contractId}.contract`), sealer
    );

    const ipfs = new IPFS();
    const wasmBlob = await ipfs.cat(wasmBlobCID);
    const wasmPath = outputPath + `${contractId}.wasm`;

    await File.writeFile(Buffer.from(wasmBlob), wasmPath, 'w');

    const sContract = new SContractReader(new File({
      fileName: contractId,
      readStream: fs.createReadStream(outputPath + `${contractId}.contract`)
    }), sealer);

    await sContract.init();

    return sContract;
  }

  public static async rollup (config: SContractConfiguration, instance: SContractReader): Promise<number> {
    if (!process.env.SEED_PHRASE) {
      throw new Error('seed phrase not found, aborting - s-contract/initialize');
    }

    const outputPath = `${config.localStoragePath}`;
    const contractId = instance.getContractId();

    const sealer = new DefaultSealer();
    const registry = new WASMContract(process.env.SEED_PHRASE, types, abi, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg');

    sealer.unlock(mnemonicToMiniSecret(process.env.SEED_PHRASE));

    await instance.writeToFile(outputPath + `${contractId}.contract`);

    const contractFile = new File({
      fileName: instance.getContractId(),
      readStream: fs.createReadStream(outputPath + `${contractId}.contract`)
    });

    const encryptionSchema = new EncryptionSchema({
      author: sealer.getAuthorKey(),
      numOfShares: 2,
      threshold: 2,
      unencryptedPieceCount: 0
    });

    encryptionSchema.addMember(sealer.getAuthorKey(), 2);
    const storage = new Crust(process.env.SEED_PHRASE);

    const result = await Driver.upstream(contractFile, sealer, encryptionSchema, storage, registry);

    /* eslint-disable */
    // @ts-ignore
    return result['ok']
    /* eslint-enable */
  }
}
