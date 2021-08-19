// Copyright 2021 @skyekiwi/file authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReadStream } from 'fs';

import crypto from 'crypto';
import FileSaver from 'file-saver';
import fs from 'fs';
import pako from 'pako';

export class File {
  public fileName: string
  public readStream?: ReadStream

  constructor (config: {
    fileName: string,
    readStream?: ReadStream
  }) {
    this.fileName = config.fileName;
    this.readStream = config.readStream;
  }

  public getReadStream (): ReadStream | undefined {
    return this.readStream;
  }

  public static async getChunkHash (chunk: Uint8Array): Promise<Uint8Array> {
    if (typeof fs === undefined) {
      return new Uint8Array(await window.crypto.subtle.digest('SHA-256', chunk));
    }

    const hashSum = crypto.createHash('sha256');

    hashSum.update(chunk);

    return hashSum.digest();
  }

  public static async getCombinedChunkHash (previousHash: Uint8Array, chunk: Uint8Array): Promise<Uint8Array> {
    if (previousHash.length !== 32) {
      console.log(previousHash);
      throw new Error('previousHash not valid - File.getCombinedChunkHash');
    }

    // size: 32bytes for previousHash + chunk size
    const combined = new Uint8Array(32 + chunk.length);

    combined.set(previousHash, 0);
    combined.set(chunk, 32);

    return await File.getChunkHash(combined);
  }

  public static deflatChunk (chunk: Uint8Array): Uint8Array {
    return pako.deflate(chunk);
  }

  public static inflatDeflatedChunk (deflatedChunk: Uint8Array): Uint8Array {
    try {
      return pako.inflate(deflatedChunk);
    } catch (err) {
      throw new Error('inflation failed - File.inflatDeflatedChunk');
    }
  }

  public static writeFile (
    content: ArrayBuffer,
    filePath: string,
    flags: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath, { flags: flags });

      stream.write(content);
      stream.end();
      stream.on('finish', () => resolve(true));
      stream.on('error', (err) => reject(err));
    });
  }

  public static saveAs (
    content: Uint8Array,
    fileName?: string,
    fileType?: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        FileSaver.saveAs(
          new Blob([content], { type: fileType }),
          fileName
        );
        resolve(true);
      } catch (err) { reject(err); }
    });
  }
}
