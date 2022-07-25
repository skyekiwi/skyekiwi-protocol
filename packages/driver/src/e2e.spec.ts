// Copyright 2021-2022 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { mnemonicToMiniSecret, mnemonicValidate } from '@polkadot/util-crypto';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'tweetnacl';

import { AsymmetricEncryption, DefaultSealer, EncryptionSchema } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { SecretRegistry } from '@skyekiwi/secret-registry';

import { Driver } from '.';

// eslint-disable-next-line
require('dotenv').config();

const filePath = path.join(__dirname, '../mock/file.file');
const downstreamPath = path.join(__dirname, '../mock/down.file');

describe('@skyekiwi/driver', function () {
  const content = randomBytes(120000);

  let vaultId1: number;
  const mnemonic = process.env.SEED_PHRASE;

  if (!mnemonicValidate(mnemonic)) {
    throw new Error('mnemonic failed to read - e2e.spec.ts');
  }

  const registry = new SecretRegistry(mnemonic, {});

  afterAll(async () => {
    await registry.disconnect();
  });

  it('upstream', async () => {
    const file = await setup(content);
    const sealer = new DefaultSealer();

    sealer.unlock(mnemonicToMiniSecret(mnemonic));

    const encryptionSchema = new EncryptionSchema();

    encryptionSchema.addMember(sealer.getAuthorKey());

    await Driver.upstream(
      file, sealer, encryptionSchema, async (metadata: Uint8Array) => {
        await registry.init();
        const res = await registry.registerSecret(metadata);

        expect(res).not.toBeNull();
        vaultId1 = res;

        if (!res) {
          throw new Error('packaging works well, blockchain network err - Driver.upstream');
        }
      }
    );

    await cleanup();
  });

  it('downstream', async () => {
    const sealer = new DefaultSealer();

    sealer.unlock(mnemonicToMiniSecret(mnemonic));

    let downstreamContent = new Uint8Array(0);

    console.log(vaultId1);
    await Driver.downstream(
      vaultId1, [mnemonicToMiniSecret(mnemonic)], registry, sealer,
      (chunk: Uint8Array) => {
        downstreamContent = new Uint8Array([...downstreamContent, ...chunk]);
      }
    );

    expect(Buffer.compare(
      downstreamContent,
      Buffer.from(content)
    )).toEqual(0);

    await cleanup();
  });

  it('generate PoA and verify PoA', async () => {
    const sealer = new DefaultSealer();

    sealer.unlock(mnemonicToMiniSecret(mnemonic));

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

    sealer.unlock(mnemonicToMiniSecret(mnemonic));
    const encryptionSchema = new EncryptionSchema();

    encryptionSchema.addMember(sealer.getAuthorKey());
    encryptionSchema.addMember(publicKey1);
    encryptionSchema.addMember(publicKey2);

    await Driver.updateEncryptionSchema(
      vaultId1, encryptionSchema, [mnemonicToMiniSecret(mnemonic)], registry, sealer,
      async (metadata: Uint8Array) => {
        await registry.init();
        const res = await registry.updateMetadata(vaultId1, metadata);

        expect(res).toEqual(true);
      }
    );

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
    await unlink(downstreamPath);
  } catch (err) {
    // pass
  }
};
