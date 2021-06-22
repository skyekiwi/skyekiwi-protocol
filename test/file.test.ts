import * as SkyeKiwi from '../src/index'
import { expect } from 'chai';
import path from 'path'
import { randomBytes } from 'tweetnacl'

import fs from 'fs'

require('dotenv').config();

const file1Path = path.join(__dirname, '/tmp/file.file1')
const file2Path = path.join(__dirname, '/tmp/file.file2')

const setup = async () => {
  // we are creating two files here:
  // tmp.file1 - a 1.2MB file with random bytes
  // tmp.file2 - a 1.19MB file with repeating byte of '187'

  try {
    cleanup()
  } catch (err) {
    // pass
  }

  const content1 = Buffer.from(randomBytes(1200000))
  const content2 = Buffer.alloc(1190000, 187)

  await SkyeKiwi.Util.writeFile(content1, file1Path, 'a')
  await SkyeKiwi.Util.writeFile(content2, file2Path, 'a')

  // SkyeKiwi.File has a default chunk size of 100MB.
  // we are making it 0.1MB here to demostrate it works
  const file1 = new SkyeKiwi.File(
    file1Path,
    'tmp.file1',
    'a testing file with 120MB random bytes',
    1 * (10 ** 5)
  )
  const file2 = new SkyeKiwi.File(
    file2Path,
    'tmp.file2',
    'a testing file with 119MB repeating 187 byte',
    1 * (10 ** 5)
  )

  return { file1, file2 }
}
const cleanup = async () => {
  const unlink = (filePath) => {
    return new Promise((res, rej) => {
      fs.unlink(filePath, (err) => {
        if (err) rej(err)
        res(true)
      });
    });
  }
  await unlink(file1Path)
  await unlink(file2Path)
}

describe('File', function () {
  this.timeout(15000)

  it('File: file size reads well', async () => {
    const { file1, file2 } = await setup()

    const size1 = file1.fileSize()
    const size2 = file2.fileSize()

    expect(size1).to.equal(1200000)
    expect(size2).to.equal(1190000)

    await cleanup()
  })

  it('File: file chunk count calculated correctly', async () => {
    const { file1, file2 } = await setup()
    const chunk1 = file1.fileChunkCount()
    const chunk2 = file2.fileChunkCount()

    expect(chunk1).to.equal(12)
    expect(chunk2).to.equal(12)

    await cleanup()
  })

  it('File: chunk hash calculation works', async () => {
    let { file1, file2 } = await setup()
    const stream1 = file1.getReadStream()
    const stream2 = file2.getReadStream()

    let hash1, hash2
    let result = {
      0: [],
      1: []
    }

    // file2 hash under chunk size of 0.1MB
    // the hash will be different when chunk size is different 
    const file2Hash = '643ff196e1568bdd5b1ba0e6bd1d131cd273caa818973527fdd6179efdad2c37'

    for (let loop = 0; loop < 2; loop++) {

      for await (const chunk of stream1) {
        if (hash1 === undefined) {
          hash1 = SkyeKiwi.File.getChunkHash(chunk)
        } else {
          hash1 = SkyeKiwi.File.getCombinedChunkHash(
            hash1, chunk
          )
        }
      }

      for await (const chunk of stream2) {
        if (hash2 === undefined) {
          hash2 = SkyeKiwi.File.getChunkHash(chunk)
        } else {
          hash2 = SkyeKiwi.File.getCombinedChunkHash(
            hash2, chunk
          )
        }
      }

      result[loop] = [hash1, hash2]
    }

    const hash1_0 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[0][0]))
    const hash2_0 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[0][1]))
    const hash1_1 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[1][0]))
    const hash2_1 = SkyeKiwi.Util.u8aToHex(new Uint8Array(result[1][1]))

    expect(hash2_0).to.equal(file2Hash)
    expect(hash2_1).to.equal(file2Hash)
    expect(hash1_0).to.equal(hash1_1)

    await cleanup()
  })

  it('File: inflate & deflat work', async () => {
    let { file1, file2 } = await setup()
    const stream1 = file1.getReadStream()
    const stream2 = file2.getReadStream()

    for await (const chunk of stream1) {
      const deflatedChunk = await SkyeKiwi.File.deflatChunk(chunk)
      const inflatedChunk = await SkyeKiwi.File.inflatDeflatedChunk(deflatedChunk)

      expect(inflatedChunk).to.deep.equal(chunk)
    }

    for await (const chunk of stream2) {
      const deflatedChunk = await SkyeKiwi.File.deflatChunk(chunk)
      const inflatedChunk = await SkyeKiwi.File.inflatDeflatedChunk(deflatedChunk)

      expect(inflatedChunk).to.deep.equal(chunk)
    }

    await cleanup()
  })
})
