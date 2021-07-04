# File Structure

To make customization to the code base, the project is structured as such:

```
.
├── LICENSE
├── README.md
├── package.json
├── test // testing for the main protocol
│   ├── integration.test.ts 
│   ├── blockchain.test.ts
│   ├── encryption.test.ts
│   ├── file.test.ts
│   ├── ipfs.test.ts
│   └── metadata.test.ts
├── src 
│   ├── Blockchain // Blockchain Adapter 
│   │   ├── Contract.ts 
│   │   ├── Crust.ts
│   │   ├── index.ts
│   │   └── sendTx.ts // helper function to send transactions, Credit: Crust Network
│   ├── Encryption
│   │   ├── Box.ts // public-key encryption
│   │   ├── SecretBox.ts // symmetric encryption
│   │   ├── TSS.ts // threshold secret sharing 
│   │   └── index.ts
│   ├── File // file handler
│   │   └── index.ts
│   ├── IPFS // ipfs client wrapper
│   │   └── index.ts
│   ├── Metadata // the heavy lifting Metadata handler
│   │   ├── Chunks.ts // process all generated chunks, not encypted
│   │   ├── EncryptionSchema.ts // normalized EncryptionSchema 
│   │   ├── Seal.ts // encryption handler
│   │   └── index.ts // main Metadata instance 
│   ├── Util
│   │   └── index.ts
│   ├── driver.ts // entry point that wraps all functions with three main APIs: upstream, downstream & updateEncryptionSchema
│   └── index.ts
├── tsconfig.json
├── tslint.json
└── yarn.lock
```
