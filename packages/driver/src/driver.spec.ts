// Copyright 2021-2022 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType, PublicKey, SecretKey } from '@skyekiwi/crypto/types';

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'stream';
import { randomBytes } from 'tweetnacl';

import { AsymmetricEncryption, initWASMInterface, secureGenerateRandomKey } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';

import { Driver, progressText } from '.';

const filePath = path.join(__dirname, '../mock/file.file');
const downstreamPath = path.join(__dirname, '../mock/down.file');

describe('@skyekiwi/driver', function () {
  const content = randomBytes(120_000);
  const progress = new EventEmitter();

  progress.on('progress', (name: string, chunkId?: number) => {
    console.log(progressText[name](chunkId));
  });

  ['sr25519', 'ed25519', 'ethereum'].map((type) => {
    const keyType = type as KeypairType;

    it(`driver for ${type}`, async () => {
      await initWASMInterface();

      const sk = {
        key: secureGenerateRandomKey(),
        keyType: keyType
      };

      const pk = {
        key: AsymmetricEncryption.getPublicKeyWithCurveType(keyType, sk.key),
        keyType: keyType
      };

      const file = await setup(content);

      // Upstream
      const ps = await Driver.generatePreSealedData(file, progress);
      const sealed = Driver.generateSealedData(ps, [pk], false, progress);

      // Downstream
      let downstreamContent = new Uint8Array(0);
      const recoveredPs = Driver.recoverFromSealedData(sealed, [sk], progress);

      await Driver.recoverFileFromPreSealedData(recoveredPs, (chunk) => {
        downstreamContent = new Uint8Array([...downstreamContent, ...chunk]);
      }, progress);

      expect(Buffer.compare(
        downstreamContent,
        Buffer.from(content)
      )).toEqual(0);

      await cleanup();
    });

    return null;
  });

  it('driver for mixed key type', async () => {
    await initWASMInterface();

    const pairs = [];

    const generatePair = (keyType: KeypairType): [PublicKey, SecretKey] => {
      const sk = { key: secureGenerateRandomKey(), keyType: keyType };
      const pk = {
        key: AsymmetricEncryption.getPublicKeyWithCurveType(sk.keyType, sk.key),
        keyType: sk.keyType
      };

      return [pk, sk];
    };

    pairs.push(generatePair('sr25519'));
    pairs.push(generatePair('ed25519'));
    pairs.push(generatePair('ethereum'));

    const file = await setup(content);

    const ps = await Driver.generatePreSealedData(file, progress);
    const sealed = Driver.generateSealedData(ps, [
      pairs[0][0], pairs[1][0], pairs[2][0]
    ], false, progress);

    const org = ps.serialize();

    const r1 = Driver.recoverFromSealedData(sealed, [pairs[0][1]], progress);

    expect(r1.serialize()).toEqual(org);

    const r2 = Driver.recoverFromSealedData(sealed, [pairs[1][1]], progress);

    expect(r2.serialize()).toEqual(org);

    const r3 = Driver.recoverFromSealedData(sealed, [pairs[2][1]], progress);

    expect(r3.serialize()).toEqual(org);

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
