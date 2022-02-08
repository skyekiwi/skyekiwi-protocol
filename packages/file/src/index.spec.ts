// Copyright 2021 - 2022 @skyekiwi/file authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { randomBytes } from 'tweetnacl';

import { u8aToHex } from '@skyekiwi/util';

import { File } from '.';

const file1Path = '/tmp/file.file1';

describe('@skyekiwi/file', function () {
  it('File: chunk hash calculation works', async () => {
    const file1 = await setup();
    const stream1 = file1.getReadStream();

    let hash1;

    for await (const chunk of stream1) {
      if (hash1 === undefined) {
        hash1 = await File.getChunkHash(chunk);
      } else {
        hash1 = await File.getCombinedChunkHash(
          hash1, chunk
        );
      }
    }

    await cleanup();
  });

  it('File: inflate & deflat work', async () => {
    const file1 = await setup();
    const stream1 = file1.getReadStream();

    for await (const chunk of stream1) {
      const deflatedChunk = File.deflateChunk(chunk);
      const inflatedChunk = File.inflatDeflatedChunk(deflatedChunk);

      expect(u8aToHex(inflatedChunk)).toBe(u8aToHex(chunk));
    }

    await cleanup();
  });
});

const setup = async (): Promise<File> => {
  const content1 = randomBytes(1200000);

  await File.writeFile(content1, file1Path, 'w');

  const file1 = new File({
    fileName: 'tmp.file1',
    readStream: fs.createReadStream(file1Path, {
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

  await unlink(file1Path);
};
