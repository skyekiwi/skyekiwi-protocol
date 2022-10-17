// Copyright 2021-2022 @skyekiwi/file authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReadStream } from 'fs';

import pako from 'pako';

import { sha256Hash } from '@skyekiwi/crypto';
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
  constructor (config: {
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
  public getReadStream (): ReadStream {
    return this.readStream;
  }

  /**
    * read the whole file
    * DO NOT USE THIS IF YOU ARE TRYING TO READ A LARGE FILE
    * THE FILE MUST ALSO BE UTF8 ENCODED
    * @returns {string} the whole file content
   */
  public async readAll (): Promise<string> {
    let content = '';

    for await (const chunk of this.readStream) {
      content += u8aToString(chunk);
    }

    return content;
  }

  /**
    * get the checksum hash of a signle Chunk
    * @param {Uint8Array} chunk the chunk to be calculated
    * @returns {Uint8Array} the resulting hash
  */
  public static getChunkHash (chunk: Uint8Array): Uint8Array {
    return sha256Hash(chunk);
  }

  /**
    * deflate a chunk
    * @param {Uint8Array} chunk the chunk to be deflated
    * @returns {Uint8Array} the deflated chunk
  */
  public static deflateChunk (chunk: Uint8Array): Uint8Array {
    // pako is cross platform, it can be used on both nodejs and browsers
    return pako.deflate(chunk);
  }

  /**
    * inflate a deflated chunk
    * @param {Uint8Array} deflatedChunk an deflated chunk
    * @returns {Uint8Array} the inflated chunk
  */
  public static inflatDeflatedChunk (deflatedChunk: Uint8Array): Uint8Array {
    try {
      return pako.inflate(deflatedChunk);
    } catch (err) {
      throw new Error('inflation failed - File.inflatDeflatedChunk');
    }
  }

  /**
    * write file to a path (used in Node.js)
    * @param {Uint8Array} content content to be written
    * @param {string} filePath path to the output path
    * @param {string} flag the writeStream flag, usually 'a' so that the file can be written in chunks
    * @returns {Promise<boolean>} whether the file writting is successful
  */
  public static writeFile (
    content: Uint8Array,
    filePath: string,
    flags: string,
    extFilters?: string[] // whitelist of file extensions
  ): Promise<boolean> {
    if (extFilters && extFilters.length > 0) {
      const fileExt = filePath.split('.').pop().toLowerCase();

      if (!extFilters.includes(fileExt)) {
        throw new Error(`file extension ${fileExt} is not allowed - File.writeFile`);
      }
      // nodejs   File.writeFile('xxx', 'y.js', 'w', ['jpg', 'png', 'gif'])
    }

    return new Promise((resolve, reject) => {
      try {
        /* eslint-disable */
        const { createWriteStream } = require('fs');
        const stream: NodeJS.ReadStream = createWriteStream(filePath, { flags: flags });

        stream.write(content);
        stream.end();
        stream.on('finish', () => resolve(true));
        stream.on('error', (err: Error) => reject(err));
        /* eslint-enable */
      } catch (err) {
        reject(new Error('File.writeFile is not avalaible in browser - File.writeFile'));
      }
    });
  }

  /**
    * save and download a file in **Browser**
    * @param {Uint8Array} content content to be written
    * @param {string} fileName name of the file
    * @param {string} fileType type of the file
    * @returns {Promise<boolean>} whether the file writting is successful
  */
  public static saveAs (
    content: Uint8Array,
    fileName?: string,
    fileType?: string,
    extFilters?: string[] // whitelist of file extensions
  ): Promise<boolean> {
    if (extFilters && extFilters.length > 0) {
      const fileExt = fileName.split('.').pop().toLowerCase();

      if (!extFilters.includes(fileExt)) {
        throw new Error(`file extension ${fileExt} is not allowed - File.writeFile`);
      }
      // nextjs  File.saveAs('abc2', 'a.gif', "text/plain;charset=utf-8", ['jpg', 'png']);//
    }

    return new Promise((resolve, reject) => {
      try {
        /* eslint-disable */
        const FileSaver = require('file-saver');
        FileSaver.saveAs(
          new window.Blob([content], { type: fileType }),
          fileName
        );
        /* eslint-enable */
        resolve(true);
      } catch (err) {
        reject(new Error('FileSaver is not supported - File.saveAs'));
      }
    });
  }
}
