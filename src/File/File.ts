import fs from 'fs'
import crypto from 'crypto'
import zlib from 'zlib'

import {RawFile} from '../index'

class File {

  private rawFile: RawFile
  private readStream: any

  constructor(rawFile: RawFile) {
    this.rawFile = rawFile;
    this.readStream = fs.createReadStream(rawFile.filePath, {
      highWaterMark: this.rawFile.fileChunkSize
    })
  }

  public fileSize(): number {
    const stats = fs.statSync(this.rawFile.filePath)
    return stats.size
  }

  public fileChunkCount(): number {
    return Math.ceil(this.fileSize() / this.rawFile.fileChunkSize)
  }

  public getReadStream() {
    return this.readStream;
  }

  public static writeChunk(chunk: Uint8Array, writeStream: any) {
    writeStream.write(chunk)
  }

  public static getChunkHash(chunk: Uint8Array) : Uint8Array {
    let hashSum = crypto.createHash('sha256');
    hashSum.update(chunk);
    return hashSum.digest();
  }

  public static getCombinedChunkHash(previousHash: Uint8Array, chunk: Uint8Array) : Uint8Array {
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
}

export { File }
