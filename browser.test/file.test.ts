import * as SkyeKiwi from '../src/index'
import { expect } from 'chai';
import { randomBytes } from 'tweetnacl'

import fs from 'fs'

const file1Path = './file.file1'
const setup = async () => {
  // we are creating two files here:
  // tmp.file1 - a 1.2MB file with random bytes

  // try {
  //   cleanup()
  // } catch (err) {
  //   // pass
  // }

  const content1 = randomBytes(1200000)
  await SkyeKiwi.File.writeFile(content1, file1Path, 'a')

  // SkyeKiwi.File has a default chunk size of 100MB.
  // we are making it 0.1MB here to demostrate it works
  const file1 = new SkyeKiwi.File(
    'tmp.file1',
    fs.createReadStream(file1Path, {
      highWaterMark: 1 * (10 ** 5)
    })
  )

  return { file1 }
}
// const cleanup = async () => {
//   const unlink = (filePath) => {
//     return new Promise((res, rej) => {
//       fs.unlink(filePath, (err) => {
//         if (err) rej(err)
//         res(true)
//       });
//     });
//   }
//   await unlink(file1Path)
// }

describe('File', function () {
  this.timeout(15000)

  it('File: chunk hash calculation works', async () => {
    let { file1 } = await setup()
    const stream1 = file1.getReadStream()


    let hash1
    for await (const chunk of stream1) {
      if (hash1 === undefined) {
        hash1 = await SkyeKiwi.File.getChunkHash(chunk)
      } else {
        hash1 = await SkyeKiwi.File.getCombinedChunkHash(
          hash1, chunk
        )
      }
    }
    // await cleanup()
  })

  it('File: inflate & deflat work', async () => {
    let { file1 } = await setup()
    const stream1 = file1.getReadStream()
    for await (const chunk of stream1) {
      const deflatedChunk = await SkyeKiwi.File.deflatChunk(chunk)
      const inflatedChunk = await SkyeKiwi.File.inflatDeflatedChunk(deflatedChunk)

      expect(inflatedChunk).to.deep.equal(chunk)
    }
    // await cleanup()
  })
})
