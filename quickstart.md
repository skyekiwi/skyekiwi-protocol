# Getting Started

## Test the code
1. Clone this repo to your local environment & install dependencies 

```bash
git clone git@github.com:skyekiwi/skyekiwi-protocol.git
yarn
```

2. Install global dependencies

```bash
yarn global add mocha
yarn global add ts-node
```

2. Create `.env`  files at the project home directory and write your seed phrase to it

```
SEED_PHRASE = 'xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx'
```

3. Get some test-net tokens to interact with the blockchain. By default, SkyeKiwi uses the [Jupiter Network](https://github.com/patractlabs/jupiter/) for smart contract runtime and [Crust Network - Rocky Testnet](https://wiki.crust.network/docs/en/buildRockyGuidance) for storage.

- Faucet on the Jupiter network is available at [LINK](https://patrastore.io/#/jupiter-a1/system/accounts)
- Faucet on the Crust Network - Rocky Testnet is available at [LINK](https://github.com/decloudf/faucet-bot/issues)

4. Run Tests. The process can take somewhere between 3minutes to 10 minutes, depends on network connection. 

```bash
yarn test
```

5. Relax. After a few minutes. It should produce something similar as:

```
$ yarn test:all
$ mocha -r ts-node/register ./spec/*.test.ts

  Blockchain
    ✓ Blockchain: send contract tx & storage order works (33919ms)

  Encryption
    ✓ Symmetric: Encryption & Decryption Works
    ✓ Asymmetric: Encryption & Decryption Works
    ✓ Symmetric: Decryption Fails w/Wrong Key
    ✓ Asymmetric: Decryption Fails w/Wrong Key
    ✓ TSS: Sharing Works

  File
    ✓ File: file size reads well
    ✓ File: file chunk count calculated correctly
    ✓ File: chunk hash calculation works (44ms)
    ✓ File: inflate & deflat work (147ms)

  Integration
    ✓ upstream, author only (59532ms)
    ✓ downstream, author only (31919ms)
    ✓ upstream, two members + author (69974ms)
    ✓ downstream, two members + author (33960ms)
    ✓ update encryptionSchema & downstream again (40926ms)

  IPFS Client
    ✓ ipfs works (65381ms)

  Metadata
    ✓ Seal: sealing & recover works
    ✓ Chunks: chunks are recorded well & CID list matches (16470ms)


  18 passing (6m)

```

## Integrate into your project

The library is designed to be heavily modified by users to fit their specific needs. For general usages of the library "as-is", please go to [Integrate SkyeKiwi](usage.md) page. Otherwise, please visit the "Customization" tab for details. 
