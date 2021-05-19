// import {randomBytes} from 'tweetnacl'

// const main = () => {

//   const key = randomBytes(32)
//   const key_string = Buffer.from(key).toString('hex')

//   let ident = Uint8Array.from(Buffer.from('244ccad30a21fbadd7330bf9d187a6dd26d464cb4da4eb4a61a55670b37b2619', 'hex'))

//   let result = new Uint8Array(32 + ident.length)

//   result.set(key, 0)
//   result.set(ident, 32)

//   console.log(key.length)
//   console.log(key_string)
//   console.log(key)

//   console.log(result.length)
//   console.log(Buffer.from(result).toString('hex'))
//   console.log(result)

//   console.log(result.slice(0, 32))

//   console.log(result.slice(32, result.length))
//   console.log(ident)
// }

// main()

// // import {
// //   File,
// //   RawFileMetadata
// // } from './index'

// // import { Writable } from 'stream'
// // import fs from 'fs'

// // class pipe1 extends Writable {

// //   _write(chunk, next) {
// //     console.log(chunk.length);
// //     next()
// //   }
// // }

// // const main = async() => {

// //   const fileHandle = new RawFileMetadata(
// //     __dirname + '/test.mp4',
// //     'test.mp4', 'a testing movie'
// //   )

// //   const file = new File(fileHandle)
// //   const sourceStream = file.getReadStream()

// //   sourceStream
// //     .pipe(pipe1)
// //     .pipe(fs.createWriteStream(__dirname + '/out.mp4'))
// // }

// // main()

import {
  Driver, RawFile, Seal, EncryptionSchema, IPFS
} from './index'
import { mnemonicGenerate } from '@polkadot/util-crypto'

const main = async() => {
  const mnemonic = mnemonicGenerate()
  console.log('mnemonic', mnemonic)


  const author = Seal.getPublicAuthorKey(mnemonic)

  const ipfs = new IPFS({
    host: 'localhost',
    port: 5001,
    protocol: 'http'
  })

  const encryptionSchema = new EncryptionSchema(
    2, 2, author,
    1,
    ipfs,
    ipfs,
    ipfs
  )

  encryptionSchema.addMember(author, ipfs)

  const key = new Seal(encryptionSchema, mnemonic)
  const fileHandle = new RawFile(
    __dirname + '/test.png',
    'test.png', 'a testing file'
  )
  
  const skyekiwi = new Driver(encryptionSchema, fileHandle, key)
  await skyekiwi.upstream()

  console.log()
  // const result = Buffer.from(chunkMetadata).toString('hex')
  // console.log(result)
  // console.log(result.length)
  
}
main()




// import {File} from './File/File'
// import zlib from 'zlib'
// import {promisify} from 'util'
// import crypto from 'crypto'
// import fs from 'fs'

// import {IPFS} from './IPFS/IPFS'
// // const deflate = promisify(zlib.deflate)
// // const inflate = promisify(zlib.inflate)

// const main = async() => {

//   const ipfs = new IPFS({
//     host: 'ipfs.infura.io',
//     port: 5001,
//     protocol: 'https'
//   })

//   const result = await ipfs.add("a random string")
//   console.log()
//   // const filePath = __dirname + '/test.mp4'

//   // const file = new File(filePath)
//   // let chunk: Uint8Array

//   // // const write = fs.createWriteStream(__dirname + '/out.mp4')
//   // while (null != (chunk = await file.readNextChunk())) {

//   //   // File.writeChunk(chunk, write)
//   //   console.log('hash', File.getChunkHash(chunk))
//   //   console.log('hash', File.getChunkHash(chunk).length)
//   //   // const compressedChunk = await deflate(chunk)
//   //   // console.log(chunk.length)
//   //   // console.log(compressedChunk.length)
//   //   // console.log(await inflate(compressedChunk))

//   //   // let hashSum = crypto.createHash('sha256')
//   //   // hashSum.update(chunk)
//   //   // console.log( hashSum.digest('hex') )

//   //   // process.exit(0)
//   // }
// }

// main()


// // import crypto from 'eth-crypto'

// // const main = async () => {

// //   const { publicKey, privateKey } = crypto.createIdentity()
// //   console.log(publicKey)
// //   console.log(privateKey)

// //   const encryptionSchema = new EncryptionSchema(
// //     2, // pieces
// //     2, // quorum
// //     1, // publicPieceCount
// //     new IPFS(new IPFSConfig("ipfs.infura.io", 5001, "https")), // metadata_ipfs
// //     new IPFS(new IPFSConfig("ipfs.infura.io", 5001, "https")), // public_pieces_ipfs

// //     // members
// //     {}
// //   )

// //   encryptionSchema.members[publicKey] =
// //     new IPFS(new IPFSConfig("ipfs.infura.io", 5001, "https"))

// //   const file = new File(__dirname + '/passwords.json')
// //   const driver = new Driver(encryptionSchema)

// //   const result = await driver.encryptChuncks(file)
// //   console.log('result', result)
// //   const ipfs_client = new IPFS(new IPFSConfig("ipfs.infura.io", 5001, "https"))
// //   const cids = await ipfs_client.cat(result)

// //   console.log(cids)
// //   await driver.decryptChunks(__dirname + 'out.json', cids, publicKey, privateKey)

// // }
// // main()

// // export { IPFS }
