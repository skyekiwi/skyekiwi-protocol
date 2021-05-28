// import {Blockchain} from './index'
// require('dotenv').config();
// // import { randomBytes} from 'tweetnacl'

// const abi = require('../contract/artifacts/skyekiwi.json')
// const main = async() => {

//   const seed = process.env.SEED_PHRASE

//   const blockchain = new Blockchain(
//     seed,
//     '3hBx1oKmeK3YzCxkiFh6Le2tJXBYgg6pRhT7VGVL4yaNiERF',
//     'wss://jupiter-poa.elara.patract.io',
//     'wss://rocky-api.crust.network/',
//     abi)
  
//   await blockchain.init()

//   // const storage = blockchain.storage
//   // const instance = blockchain.instance


//   // let content = []
//   // for (let i = 0; i < 3; i++) {
//   //   content.push(randomBytes(1000))
//   // }

//   // const result = await storage.placeBatchOrder(content)
//   // console.log(result)

//   // const result = await instance.execContract(
//   //   'createVault', ['QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm'])
//   // console.log(result)



// }
// main()

// // import IPFS from 'ipfs-core';
// // // import {
// // //   IPFSClient
// // //   // Driver, RawFile, Seal, EncryptionSchema,
// // // } from './index'
// // import {waitReady} from '@polkadot/wasm-crypto'
// // import { ApiPromise, WsProvider } from '@polkadot/api';
// // import { typesBundleForPolkadot } from '@crustio/type-definitions';
// // import { Keyring } from '@polkadot/keyring';
// // // import { randomBytes } from 'tweetnacl'

// // // SubmitTx ported from crustio codebase
// // const submitTx = async (extrinsic, signer) => {
// //   return new Promise((resolve, reject) => {
// //     extrinsic.signAndSend(signer, ({ events = [], status }) => {
// //       console.log(
// //         `  ↪ 💸  Transaction status: ${status.type}, nonce: ${extrinsic.nonce}`
// //       );

// //       if (
// //         status.isInvalid ||
// //         status.isDropped ||
// //         status.isUsurped ||
// //         status.isRetracted
// //       ) {
// //         reject(new Error('Invalid transaction'));
// //       } else {
// //         // Pass it
// //       }

// //       if (status.isInBlock) {
// //         events.forEach(({ event: { method, section } }) => {
// //           if (section === 'system' && method === 'ExtrinsicFailed') {
// //             // Error with no detail, just return error
// //             console.error(`  ↪ ❌  Send transaction(${extrinsic.type}) failed.`);
// //             resolve(false);
// //           } else if (method === 'ExtrinsicSuccess') {
// //             console.log(`  ↪ ✅  Send transaction(${extrinsic.type}) success.`);
// //             resolve(true);
// //           }
// //         });
// //       } else {
// //         // Pass it
// //       }
// //     }).catch(e => {
// //       reject(e);
// //     });
// //   });
// // }

// // const main = async () => {

// //   await waitReady();

// //   const ipfs = await IPFS.create();
  
// //   const cid = await ipfs.add(
// //     "a testing string",
// //     {
// //       progress: (prog) => console.log(`Add received: ${prog}`)
// //     }
// //   );

// //   const fileStat = await ipfs.files.stat("/ipfs/" + cid.path);

// //   const chain_ws_url = "wss://rocky-api.crust.network"
// //   let api = new ApiPromise({
// //     provider: new WsProvider(chain_ws_url),
// //     typesBundle: typesBundleForPolkadot,
// //   });

// //   api = await api.isReadyOrError;

// //   const seeds = "riot hand shuffle card company must rocket jealous present hurt lava multiply";

// //   const keyring = (new Keyring({
// //     type: 'sr25519',
// //   })).addFromUri(seeds);

// //   console.log(cid.path, fileStat.cumulativeSize)
// //   const extrinsic = api.tx.market.placeStorageOrder(
// //     cid.path, fileStat.cumulativeSize,
// //     0
// //   );

// //   const tx = await submitTx(extrinsic, keyring)
// //   console.log(tx)

// // }


// // main().catch(e => {
// //   console.log(e);
// // });

// // // const main = async () => {

// // //   await waitReady()

// // //   const chain_ws_url = "wss://rocky-api.crust.network"
// // //   let api = new ApiPromise({
// // //     provider: new WsProvider(chain_ws_url),
// // //     typesBundle: typesBundleForPolkadot,
// // //   });
// // //   api = await api.isReadyOrError;

// // //   const seeds = "riot hand shuffle card company must rocket jealous present hurt lava multiply";

// // //   const keyring = (new Keyring({
// // //     type: 'sr25519',
// // //   })).addFromUri(seeds);

// // //   const crust = new Crust(keyring, api)

// // //   let content = []
// // //   for (let i = 0; i < 100; i++) {
// // //     content.push(randomBytes(1000))
// // //   }

// // //   //https://apps.crust.network/?rpc=wss%3A%2F%2Frocky-api.crust.network%2F#/explorer/query/0x7bd4c5353dd1ca4f025d1bf0cdda69f7b0ba98c99c3133ff7f5a02e9f3df12be 
// // //   const result = await crust.placeBatchOrder(content)
// // //   console.log(result)
// // //   // console.log(await crust.getStoragePrice(1000) * 1000)

// // //   // 9677.734375
// // //   // 9677734.375
// // // }
// // // main()


import {
  Driver, RawFile, Seal, EncryptionSchema, IPFS, Box
} from './index'
import { mnemonicGenerate, mnemonicToMiniSecret } from '@polkadot/util-crypto'

const upstream = async() => {
  const mnemonic = mnemonicGenerate()
  console.log('mnemonic', mnemonic)


  const author = Box.getPublicKeyFromPrivateKey(
    mnemonicToMiniSecret(mnemonic)
  )

  // const ipfs = new IPFS({
  //   host: 'localhost',
  //   port: 5001,
  //   protocol: 'http'
  // })

  const encryptionSchema = new EncryptionSchema(
    2, 2, author, 1
  )

  encryptionSchema.addMember(author)

  const key = new Seal(encryptionSchema, mnemonic)
  const fileHandle = new RawFile(
    __dirname + '/test.png',
    'test.png', 'a testing file'
  )
  
  const skyekiwi = new Driver(encryptionSchema, fileHandle, key)
  await skyekiwi.upstream()
}
upstream()
