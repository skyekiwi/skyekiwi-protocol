# Project Structure
The protocol works in both Node.js environment and browsers. They works slightly different. This article will run through the processing pipiline and how it operates differently 

## `SkyeKiwi.File`
Inputing files to the SkyeKiwi Protocol are read as binanry stream. For Node.js, we use the default `stream` module with `fs` , for browsers, we use `memfs` to implement a simulated `fs` in memory. 

```javascript
// default at 100MB
const file = new SkyeKiwi.File(
  'filename.txt',
  fs.createReadStream(filePath, { 
    highWaterMark: 1 * (10 ** 8) 
  })
)
```



## `SkyeKiwi.Encryption`

The encryption modules is composited with 3 modules: `SymmetricEncryption`, `AsymmetricEncryption` and `TSS`. Both `SymmetricEncryption`, `AsymmetricEncryption`  are packaged from the famous `tweelnacl` package. 

- `SymmetricEncryption` and `AsymmetricEncryption` are pretty self-explanatory
- `TSS` handles threshold secret sharing encryption. It is build based on the `secret.js` package maintained by SkyeKiwi, as a fork of `secrets.js-grempe`, which is included in Slant PrivEOS and audited. The fork: `@skyekiwi/secrets` has little difference from the original `secrets.js-grempe` and only contains a few customization. 

## `SkyeKiwi.IPFS`

IPFS packages an ipfs client. 

By default, we use two IPFS remote pin service before the Crust Network is able to fetch the files. 

- **SkyeKiwi Nodes**: Our own remote IPFS pinning server. 

- **Infura**: https://infura.io/docs/ipfs: You don't need to do anything with this, they are offering IPFS pinning without authorization for now. However, pinning to Infura might fail sometimes. 

When pushing content to IPFS, the IPFS module of the SkyeKiwi Protocol will try to push content to SkyeKiwi IPFS, if the HTTP request fails,, it will fall back to Infura IPFS. If Infura IPFS fails again, it will fallback to start a local IPFS node, in that case, you will be required to keep the local IPFS node running, so that the Crust Network can fetch the file. It might take up to 2 hours for the Crust Network to pick up the file. Please refer to [Crust Wiki](https://wiki.crust.network/docs/en/storageUserGuide) for file fetching. 

Similarly, for `ipfs.cat`, it will first try to fetch through a list of public IPFS gatewey, if failed, it will try to use an Infura ipfs gateway, if failed again, use SkyeKiwi IPFS Gateway, if failed again, it will fall back to a local node. 

If an `ERR_LOCK_EXISTS` appears on `jsipfs`, it is because that you are trying to start another local IPFS node when there is already one running. Run `await ipfs.stopIfRunning()` to stop the local IPFS node. `stopIfRunning` will always do checks and if there is actually a local node running, if not, it will not do anything. Therefore, if a local IPFS node is not needed, always run `await ipfs.stopIfRunning()`. 



## `SkyeKiwi.Blockchain`

This module interacts with blockchains. It has two parts: `Crust.ts` to interact with the Crust Network, and `Contract.ts` can be modified to connect to any Substrate-based blockchains with WASM smart contract enabled. 



```javascript
const blockchain = new SkyeKiwi.Blockchain(
  // seed phrase
  mnemonic,
  // contract address
  '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg',
  // contract instance endpoint
  'wss://ws.jupiter-poa.patract.cn',
  // storage network endpoint
  'wss://rocky-api.crust.network/',
)

await blockchain.init()

// Crust Storage Instance
const storage = blockchain.storage

// Contract Instance
const contract = blockchain.contract
```



For smart contract, it needs to be provided a smart contract abi. A sample contract provided by SkyeKiwi can be found at: [SkyeKiwi - Contract Demo](https://github.com/skyekiwi/contract-demo) .



To make transactions to the Crust Network: 

```javascript
let content = []
content.push( await ipfs.add(_content_) )
//@ts-ignore
const crustResult = await storage.placeBatchOrderWithCIDList(content)
```

To check for status of the storage order: 

```javascript
await storage.awaitNetworkFetching(content)
```



To make smart contract calls:

```javascript
const contractResult = await contract.execContract(
      'createVault', ['QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm'])
```



> One extra thing about Substrate WASM contract execution is that they do not return results. Therefore, we adopt a dirty method as [Redspot - Issue 78](https://github.com/patractlabs/redspot/issues/78)



## `SkyeKiwi.Metadata`

This is the metadata handler, it is the one that does the heavy lifting. Please refer to [Metadata Structure](metadata.md)



## `SkyeKiwi.Driver`

The Driver expose top level APIs of the SkyeKiwi Protocol. There are three APIs exposed by this module: `driver.upstream` `driver.downstream` and `driver.updateEncryptionSchema`. 



The processing pipeline will be explained in the [Metadata Structure](metadata.md)



They can be called as:

```javascript
const mnemonic = process.env.SEED_PHRASE
const blockchain = new SkyeKiwi.Blockchain(
  // seed phrase
  mnemonic,
  // contract address
  '3cNizgEgkjB8TKm8FGJD3mtcxNTwBRxWrCwa77rNTq3WaZsM',
  // contract instance endpoint
  'wss://jupiter-poa.elara.patract.io',
  // storage network endpoint
  'wss://rocky-api.crust.network/',
)

const encryptionSchema = new SkyeKiwi.EncryptionSchema({
  numOfShares: 2, 
  threshold: 2, 
  author: author, 
  unencryptedPieceCount: 1
})
encryptionSchema.addMember(author, 1)

const key = new SkyeKiwi.Seal({
  encryptionSchema: encryptionSchema, 
  seed: mnemonic
})

// upstream the file, it take two major actions: 
// upload files to the Crust Network & Write to a smart contract to generate a vaultId
await SkyeKiwi.Driver.upstream({
  file: fileHandle[0].file,
  seal: key,
  blockchain: blockchain
})
```

```javascript
const stream = fs.createWriteStream(outputPath, {flags: 'a'})
await SkyeKiwi.Driver.downstream({
  vaultId: vaultId,
  blockchain: blockchain,
  keys: [key1, key2 ... ], // private key of recipeints
  writeStream: stream,
})
```

```javascript
// upon finishing, the encryptionSchema will be updated
await SkyeKiwi.Driver.updateEncryptionSchema({
  vaultId: vaultId,
  newEncryptionSchema: encryptionSchema,
  seed: mnemonic,
  keys: [key1, key2 ... ], // private key of recipeints
  blockchain: blockchain
})
```

