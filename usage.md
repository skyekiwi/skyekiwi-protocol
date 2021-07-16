## Integrate SkyeKiwi

The SkyeKiwi Protocol can be install via npm. 

```bash
yarn add @skyekiwi/protocol
```

And import with: 

```javascript
import * as SkyeKiwi from '@skyekiwi/protocol'
```

Please refer to the `test/integration.test.ts` folder which contains test cases for common useage.



```javascript
const abi = SkyeKiwi.getAbi()
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
  // contract abi
  abi
)

const skyekiwi = new SkyeKiwi.Driver(
  encryptionSchema, // a SkyeKiwi.encryptionSchema instance - specify 
  fileHandle, // a SkyeKiwi.File instance - specify which file to upload
  key, // a SkyeKiwi.Seal instance - specify keys used
  ipfs, // a SkyeKiwi.ipfs instance - specify which IPFS to be used
  blockchain // a SkyeKiwi.Blockchain - blockchain connection instance
)

skyekiwi.upstream() // upstream the file, it take two major actions: 
// upload files to the Crust Network & Write to a smart contract to generate a vaultId
```

```javascript
await SkyeKiwi.Driver.downstream(
  vaultId, // the file id from the smart contract
  blockchain, // SkyeKiwi.Blockchain instance
  ipfs,
  downstreamPath, // where to keep the recorvered file 
  [privateKey1, privateKey2] // keys used to decrypt 
)
// upon finishing, the file will be download and recovered to the destination path
```


```javascript
await SkyeKiwi.Driver.updateEncryptionSchema(
  vaultId, // vaultId from the smart contract
  encryptionSchema, // the new encryptionSchema
  mnemonic, // blockchain seed phrase
  [mnemonicToMiniSecret(mnemonic)],  // an array of keys used to decrypt the seal
  ipfs,  
  blockchain
)
// upon finishing, the encryptionSchema will be updated
```
