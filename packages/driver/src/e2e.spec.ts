// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { mnemonicToMiniSecret, mnemonicValidate } from '@polkadot/util-crypto';
import fs from 'fs';
import { randomBytes } from 'tweetnacl';

import { Crust } from '@skyekiwi/crust-network';
import { AsymmetricEncryption, DefaultSealer, EncryptionSchema } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { WASMContract } from '@skyekiwi/wasm-contract';

import abi from '../mock/skyekiwi.json';
import types from '../mock/types';
import { Driver } from '.';

// eslint-disable-next-line
require('dotenv').config();

const filePath = '/tmp/file.file';
const downstreamPath1 = '/tmp/down1.file';
const downstreamPath2 = '/tmp/down2.file';

describe('@skyekiwi/driver', function () {
  const content = randomBytes(1200000);

  let vaultId1: number;
  const mnemonic = process.env.SEED_PHRASE;

  if (!mnemonicValidate(mnemonic)) {
    throw new Error('mnemonic failed to read - e2e.spec.ts');
  }

  const storage = new Crust(mnemonic);
  const registry = new WASMContract(mnemonic, types, abi, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg');

  afterAll(async () => {
    await storage.disconnect();
    await registry.disconnect();
  });

  it('upstream', async () => {
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

  it('downstream', async () => {
    const stream = fs.createWriteStream(downstreamPath1, { flags: 'a' });
    const sealer = new DefaultSealer();

    sealer.key = mnemonicToMiniSecret(mnemonic);

    await Driver.downstream(
      vaultId1, [mnemonicToMiniSecret(mnemonic)], registry, stream, sealer
    );

    const downstreamContent = fs.readFileSync(downstreamPath1);

    expect(Buffer.compare(
      downstreamContent,
      Buffer.from(content)
    )).toEqual(0);

    await cleanup();
  });

  it('generate PoA and verify PoA', async () => {
    const sealer = new DefaultSealer();

    sealer.key = mnemonicToMiniSecret(mnemonic);

    const sig = await Driver.generateProofOfAccess(
      vaultId1, [mnemonicToMiniSecret(mnemonic)], registry, sealer,
      new Uint8Array([0x0, 0x1, 0x2, 0x3])
    );

    expect(Driver.verifyProofOfAccess(sig)).toEqual(true);

    await cleanup();
  });

  it('update encryptionSchema & downstream again', async () => {
    await setup(content);
    const sealer = new DefaultSealer();

    const privateKey1 = randomBytes(32);
    const privateKey2 = randomBytes(32);
    const publicKey1 = AsymmetricEncryption.getPublicKey(privateKey1);
    const publicKey2 = AsymmetricEncryption.getPublicKey(privateKey2);

    sealer.key = mnemonicToMiniSecret(mnemonic);
    const encryptionSchema = new EncryptionSchema({
      author: sealer.getAuthorKey(),
      numOfShares: 5,
      threshold: 3,
      unencryptedPieceCount: 1
    });

    encryptionSchema.addMember(sealer.getAuthorKey(), 2);
    encryptionSchema.addMember(publicKey1, 1);
    encryptionSchema.addMember(publicKey2, 1);

    const result = await Driver.updateEncryptionSchema(
      vaultId1, encryptionSchema, [mnemonicToMiniSecret(mnemonic)], storage, registry, sealer
    );

    expect(result).toHaveProperty('ok');
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

  try {
    await unlink(filePath);
    await unlink(downstreamPath1);
    await unlink(downstreamPath2);
  } catch (err) {
    // pass
  }
};
