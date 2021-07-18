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
