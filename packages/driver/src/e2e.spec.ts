// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { mnemonicToMiniSecret } from '@polkadot/util-crypto';
import fs from 'fs';
import { randomBytes } from 'tweetnacl';

import { Crust } from '@skyekiwi/crust-network';
import { DefaultSealer, EncryptionSchema } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { WASMContract } from '@skyekiwi/wasm-contract';

import abi from '../mock/skyekiwi.json';
import types from '../mock/types';
import { Driver } from '.';

// eslint-disable-next-line
require('dotenv').config();

const filePath = '/tmp/file.file';
const downstreamPath = '/tmp/down.file';

describe('@skyekiwi/driver', function () {
  const content = randomBytes(1200000);

  let vaultId1: number;
  const mnemonic = process.env.SEED_PHRASE;

  const storage = new Crust(mnemonic);
  const registry = new WASMContract(mnemonic, types, abi, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg');

  afterAll(async () => {
    await storage.disconnect();
    await registry.disconnect();
  });

  it('upstream, author only', async () => {
    const file = await setup(content);
    const sealer = new DefaultSealer();

    sealer.key = mnemonicToMiniSecret(mnemonic);
    const encryptionSchema = new EncryptionSchema({
      author: sealer.getAuthorKey(),
      numOfShares: 2,
      threshold: 2,
      unencryptedPieceCount: 1
    });

    encryptionSchema.addMember(sealer.getAuthorKey(), 1);

    const result = await Driver.upstream(
      file, sealer, encryptionSchema, storage, registry
    );

    expect(result).toHaveProperty('ok');

    /* eslint-disable */
    // @ts-ignore
    vaultId1 = result['ok']
    /* eslint-enable */

    await cleanup();
  });

  it('downstream, author only', async () => {
    const stream = fs.createWriteStream(downstreamPath, { flags: 'a' });
    const sealer = new DefaultSealer();

    sealer.key = mnemonicToMiniSecret(mnemonic);

    await Driver.downstream(
      vaultId1, [mnemonicToMiniSecret(mnemonic)], registry, stream, sealer
    );

    const downstreamContent = fs.readFileSync(downstreamPath);

    expect(Buffer.compare(
      downstreamContent,
      Buffer.from(content)
    )).toEqual(0);

    await cleanup();
  });
});

const setup = async (content: Uint8Array): Promise<File> => {
  await File.writeFile(content, filePath, 'w');

  const file1 = new File({
    fileName: 'tmp.file',
    readStream: fs.createReadStream(filePath, {
      highWaterMark: 1 * (10 ** 5)
    })
  });

  return file1;
};

const cleanup = async () => {
  const unlink = (filePath: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  };

  await unlink(filePath);
  await unlink(downstreamPath);
};
