// import * as SkyeKiwi from '../src/index'
// import { expect } from 'chai';
// import path from 'path'
// import { randomBytes } from 'tweetnacl'
// import {
//   stringToU8a,
//   u8aToString
// } from '@polkadot/util'
// import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'


// import fs from 'fs'

// require('dotenv').config();

// const file1Path = path.join(__dirname, '/tmp/tmp.file1')
// const file2Path = path.join(__dirname, '/tmp/tmp.file2')

// const setup = async () => {
//   // we are creating two files here:
//   // tmp.file1 - a 1.2MB file with random bytes
//   // tmp.file2 - a 1.19MB file with repeating byte of '187'

//   const content1 = Buffer.from(randomBytes(1200000))
//   const content2 = Buffer.alloc(1190000, 187)

//   await SkyeKiwi.Util.writeFile(content1, file1Path)
//   await SkyeKiwi.Util.writeFile(content2, file2Path)

//   // SkyeKiwi.File has a default chunk size of 100MB.
//   // we are making it 0.1MB here to demostrate it works
//   const file1 = new SkyeKiwi.File(
//     file1Path,
//     'tmp.file1',
//     'a testing file with 120MB random bytes',
//     1 * (10 ** 5)
//   )
//   const file2 = new SkyeKiwi.File(
//     file2Path,
//     'tmp.file2',
//     'a testing file with 119MB repeating 187 byte',
//     1 * (10 ** 5)
//   )

//   return { file1, file2 }
// }
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
//   await unlink(file2Path)
// }

// describe('Integration', function() {

//   it('upstream', async function() {
//     await setup()

//     await cleanup()
//   })

//   it('downstream', async function() {

//   })

//   it('update encryptionSchema', async function() {

//   })
  

// })
