// Copyright 2021-2022 @skyekiwi/file authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReadStream } from 'fs';

import crypto from 'crypto';
import FileSaver from 'file-saver';
import fs from 'fs';
import pako from 'pako';

import { u8aToString } from '@skyekiwi/util';

export class File {
  public fileName: string
  public readStream: ReadStream

  /**
   * Constructor of a File object
   * @constructor
   * @param {string} fileName name of the file
   * @param {readStream} readStream a readStream to the file content
  */
  constructor(config: {
    fileName: string,
    readStream: ReadStream
  }) {
    this.fileName = config.fileName;
    this.readStream = config.readStream;
  }

  /**
    * get the file ReadStream
    * @returns {ReadStream} the file ReadStream
  */
  public getReadStream(): ReadStream {
    return this.readStream;
  }

  /**
    * read the whole file
    * DO NOT USE THIS IF YOU ARE TRYING TO READ A LARGE FILE
    * THE FILE MUST ALSO BE UTF8 ENCODED
    * @returns {string} the whole file content
   */
  public async readAll(): Promise<string> {
    let content = '';

    for await (const chunk of this.readStream) {
      content += u8aToString(chunk);
    }

    return content;
  }

  /**
    * get the checksum hash of a signle Chunk
    * @param {Uint8Array} chunk the chunk to be calculated
    * @returns {Promise<Uint8Array>} the resulting hash
  */
  public static async getChunkHash(chunk: Uint8Array): Promise<Uint8Array> {
    if (typeof window === undefined) {
      /* browser mode */
      return new Uint8Array(await window.crypto.subtle.digest('SHA-256', chunk));
    }

    const hashSum = crypto.createHash('sha256');

    hashSum.update(chunk);

    return hashSum.digest();
  }

  /**
    * get the checksum hash of the previousHash combined with the current chunk
    * @param {Uint8Array} previousHash hash of all previous chunk(s)
    * @param {Uint8Array} chunk the chunk to be calculated
    * @returns {Promise<Uint8Array>} the resulting hash
  */
  public static async getCombinedChunkHash(previousHash: Uint8Array, chunk: Uint8Array): Promise<Uint8Array> {
    // the hash of the previous chunk(s) and the current chunk is used to ensure the sequencing of all chunks are correct

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

  /**
    * deflate a chunk
    * @param {Uint8Array} chunk the chunk to be deflated
    * @returns {Uint8Array} the deflated chunk
  */
  public static deflateChunk(chunk: Uint8Array): Uint8Array {
    // pako is cross platform, it can be used on both nodejs and browsers
    return pako.deflate(chunk);
  }

  /**
    * inflate a deflated chunk
    * @param {Uint8Array} deflatedChunk an deflated chunk
    * @returns {Uint8Array} the inflated chunk
  */
  public static inflatDeflatedChunk(deflatedChunk: Uint8Array): Uint8Array {
    try {
      return pako.inflate(deflatedChunk);
    } catch (err) {
      throw new Error('inflation failed - File.inflatDeflatedChunk');
    }
  }

  /**
    * write file to a path (used in Node.js)
    * @param {ArrayBuffer} content content to be written
    * @param {string} filePath path to the output path
    * @param {string} flag the writeStream flag, usually 'a' so that the file can be written in chunks
    * @returns {Promise<boolean>} whether the file writting is successful
  */
  public static writeFile(
    content: ArrayBuffer,
    filePath: string,
    flags: string,
    extFilters?: string[] // whitelist of file extensions
  ): Promise<boolean> {
    const fileExt = filePath.split('.').pop().toLowerCase();

    if (!extFilters.includes(fileExt)) {
      throw new Error(`file extension ${fileExt} is not allowed - File.writeFile`);
    }
    // nodejs   File.writeFile('xxx', 'y.js', 'w', ['jpg', 'png', 'gif'])

    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath, { flags: flags });

      stream.write(content);
      stream.end();
      stream.on('finish', () => resolve(true));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
    * save and download a file in **Browser**
    * @param {Uint8Array} content content to be written
    * @param {string} fileName name of the file
    * @param {string} fileType type of the file
    * @returns {Promise<boolean>} whether the file writting is successful
  */
  public static saveAs(
    content: Uint8Array,
    fileName?: string,
    fileType?: string,
    extFilters?: string[] // whitelist of file extensions
  ): Promise<boolean> {
    const fileExt = fileName.split('.').pop().toLowerCase();

    if (!extFilters.includes(fileExt)) {
      throw new Error(`file extension ${fileExt} is not allowed - File.writeFile`);
    }
    // nextjs  File.saveAs('abc2', 'a.gif', "text/plain;charset=utf-8", ['jpg', 'png']);//

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
