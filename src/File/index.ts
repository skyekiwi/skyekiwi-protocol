import fs from 'fs'
import crypto from 'crypto'
import zlib from 'zlib'

import { Util } from '../index'

export class File {

  public readStream: any
  public fileChunkSize?: number

  constructor(
    public filePath: string,
    public fileName: string,
    public fileNote: string,
    fileChunkSize?: number
  ) {
    this.fileChunkSize = fileChunkSize ? fileChunkSize : 1 * (10 ** 8);
    this.readStream = fs.createReadStream(filePath, {
      highWaterMark: this.fileChunkSize
    })
  }

  public fileSize(): number {
    const stats = fs.statSync(this.filePath)
    return stats.size
  }

  public fileChunkCount(): number {
    return Math.ceil(this.fileSize() / this.fileChunkSize)
  }

  public getReadStream() {
    return this.readStream;
  }

  public static getChunkHash(chunk: Uint8Array): Uint8Array {
    let hashSum = crypto.createHash('sha256');
    hashSum.update(chunk);
    return hashSum.digest();
  }

  public static getCombinedChunkHash(previousHash: Uint8Array, chunk: Uint8Array): Uint8Array {
    let hashSum = crypto.createHash('sha256');

    if (previousHash.length !== 32) {
      throw new Error("previousHash not valid - File.getCombinedChunkHash");
    }

    // size: 32bytes for previousHash + chunk size 
    const combined = new Uint8Array(32 + chunk.length);
    combined.set(previousHash, 0);
    combined.set(chunk, 32);

    hashSum.update(combined)
    return hashSum.digest()
  }

  public static deflatChunk(chunk: Uint8Array): Promise<Uint8Array> {
    return new Promise((res, rej) => {
      zlib.deflate(chunk, (err, result) => {
        if (err) rej(err);
        else res(result);
      });
    });
  }

  public static inflatDeflatedChunk(deflatedChunk: Uint8Array): Promise<Uint8Array> {
    return new Promise((res, rej) => {
      zlib.inflate(deflatedChunk, (err, result) => {
        if (err) rej(err);
        else res(result);
      });
    });
  }

  public serialize() {
    return Util.serialize({
      // we are not gonna publish the filePath
      // filePath: this.filePath,
      fileName: this.fileName,
      fileNote: this.fileNote,
      fileChunkSize: this.fileChunkSize
    })
  }

  public static parse(str: string) {
    const object = Util.parse(str)
    if (!object.fileName || !object.fileNote) {
      throw new Error('parse error: File.parse')
    }
    return new File(object.filePath, object.fileName, object.fileNote, object.fileChunkSize)
  }
}

export class FileDigest{ 
  public fileChunkSize?: number

  constructor(
    public fileName: string,
    public fileNote: string,
    fileChunkSize?: number
  ) {
    this.fileChunkSize = fileChunkSize ? fileChunkSize : 1 * (10 ** 8);
  }

  public serialize() {
    return Util.serialize({
      fileName: this.fileName,
      fileNote: this.fileNote,
      fileChunkSize: this.fileChunkSize
    })
  }

  public static parse(str: string) {
    const object = Util.parse(str)
    if (!object.fileName || !object.fileNote) {
      throw new Error('parse error: File.parse')
    }
    return new FileDigest(
      object.fileName, object.fileNote, object.fileChunkSize)
  }
}
