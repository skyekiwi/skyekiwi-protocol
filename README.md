<img src="https://tva1.sinaimg.cn/large/008i3skNgy1gqz4uri7ckj33dl0otn1c.jpg" width="600px"/>

**NOTE:** This is a very early version of the SkyeKiwi Protocol. It is in heavy development. We will not advise anyone to use in production environment yet.


> **A fun background story behind our logo** <br/><br/>
> Little do people know that among all Greek letters, Sigma is a special one. Not only because it’s the Greek for S and S for  SkyeKiwi(duh..), but also because it’s the only Greek letter that can be written in three ways: uppercase “Σ”, lowercase “σ” and lowercase in word-final position “ς” and English likely adopt “ς” as “S” (they do look alike, right?). We make our logo to honor the Greeks’ letter Sigma but intentionally leave out the “ς” ( at a word-final position :) ), to keep this a secret (Shhhh... ). To read more on this fun Greek fact. [Link](https://en.wikipedia.org/wiki/Sigma)

Documentation: [https://cdocs.skye.kiwi](https://cdocs.skye.kiwi)

## Introduction

## What is SkyeKiwi?
SkyeKiwi is using a combination of various well-developed cryptographic schema to create a solution of securely sharing information in blockchain networks. The capacities of blockchain networks will be significantly enhanced when programable secrets can be processed through a decentralized network. We believe an innovative and unique new economic model will be created when secrets are processed on blockchains. 

The SkyeKiwi Protocol client-side library is an early experimental library that is capable of sharing files of arbitrary size and type to thousands of people over a public IPFS network. 


## How does it work?

The SkyeKiwi Client Library reads in files/FormData in binary stream, divide them in chunks, generate a random sealing key of 32 bytes and symmetrically encrypt these chunks with the sealing key. Later on, a list of all CIDs and the sealing key will go through a Threshold secret sharing library then encrypted with the according public key of recipeints and pushed to a public IPFS network. The encrypted key shares will be composed into a metadata file and can be securely publicized. It will be stored on IPFS then publish the CID to a smart contract. 

![skyekiwi (6)](https://tva1.sinaimg.cn/large/008i3skNgy1gqz4x7dy5sj31ip0r0q4k.jpg)

<br/><br/>
## Installation & Testing

<details><summary>Full Environment Setup</summary>

<p>
  
### Install Node.js

please reference to [Node.js Website](https://nodejs.org/en/download/) 

- We recommend you to install [yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable) as an alternative to `npm` . Simple run `npm install --global yarn` 

- The repo is tested with nodejs version `14.6.0` , to check on your nodejs version `node -v` , to switch version of node, I recommend using [n](https://github.com/tj/n) by TJ. 

    

### Setup the Substrate smart contract development environment

A good general guide to setup the environment for Substrate environment can be founded [here](https://substrate.dev/docs/en/knowledgebase/getting-started/). 

1. Install Rust for help: refer to [Rust Website](https://www.rust-lang.org/tools/install)

    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source $HOME/.cargo/env
    ```

    Check your installed version
    ```bash
    rustc --version
    cargo --version
    ```
    This guides is tested with `rustc 1.50.0 (cb75ad5db 2021-02-10)` and `cargo 1.50.0 (f04e7fab7 2021-02-04)`

2. Install [Binaryen](https://github.com/WebAssembly/binaryen). You can simply install with [Homebrew](https://brew.sh/) on macOS

    ```bash
    brew install binaryen
    ```

    To install `Homebrew` use

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

3. Install [cargo-contract](https://github.com/paritytech/cargo-contract) 

    ```bash
    cargo install --force cargo-contract
    ```


4. Grab a local Substrate blockchain node with `pallet-contract` included. There are many options: [jupiter](https://github.com/patractlabs/jupiter) is the one we choose. Alternatively, you can get [canvas](https://github.com/paritytech/canvas-node) by Parity. `Rust` is known for compiling slowly. It took me an hour to compile [jupiter](https://github.com/patractlabs/jupiter). 

    - To use [jupiter](https://github.com/patractlabs/jupiter), follow this [guide](https://github.com/patractlabs/jupiter#compile-and-run).  

    - To use [canvas](https://github.com/paritytech/canvas-node), follow this [guide](https://substrate.dev/substrate-contracts-workshop/#/0/setup?id=installing-the-canvas-node). 
    
    - Lastly, fire up the local blockchain 

        ```
        path-to-jupiter-repo/target/release/jupiter-prep --dev
        # OR with Canvas
        canvas --dev --tmp
        ```

        You can visit https://ipfs.io/ipns/dotapps.io and choose to connect to `ws://127.0.0.1:9944` to have a visual portal to interact with the blockchain. </p></details>

<details><summary>My Environment</summary>

<p>

#### Versions 

Codes are tested with the following environment:

`binaryen`: `version 101` <br/>
`cargo`: `cargo 1.51.0 (43b129a20 2021-03-16)` <br/>
`cargo-contract`:  `cargo-contract 0.10.0` <br/>
`node`: `v14.16.0` <br/>
`rust`: `rustc 1.51.0 (2fd73fabe 2021-03-23)` <br/><br/>
`canvas`: `canvas 0.1.0-385c4cc-x86_64-macos` <br/>
`OS Version`: `macOS Big Sur 11.0.1` <br/>

`ts-node`: `v10.0.0` <br/>
`mocha`: `8.4.0` <br/>

**Node Packages**
Please refer to the `package.json`

</p></details>

## Install

```bash
yarn add @skyekiwi/protocol
```

```javascript
import * as SkyeKiwi from '@skyekiwi/protocol';
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

### Run Test

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
LOG_LEVEL = 'debug'
```

3. Get some test-net tokens to interact with the blockchain. By default, SkyeKiwi uses the [Jupiter Network](https://github.com/patractlabs/jupiter/) for smart contract runtime and [Crust Network - Rocky Testnet](https://wiki.crust.network/docs/en/buildRockyGuidance) for storage.

- Faucet on the Jupiter network is available at [LINK](https://patrastore.io/#/jupiter-a1/system/accounts)
- Faucet on the Crust Network - Rocky Testnet is available at [LINK](https://github.com/decloudf/faucet-bot/issues)

4. Run Tests. The process can take somewhere between 3minutes to 10 minutes, depends on network connection. 

```bash
yarn test
```

5. Relax. The test should be able to finish within 10 minutes.

### IPFS Pin Service
By default, we use two IPFS remote pin service before the Crust Network is able to fetch the files. 

- **SkyeKiwi Nodes**: Our own remote IPFS pinning server. 

- **Infura**: https://infura.io/docs/ipfs: You don't need to do anything with this, they are offering IPFS pinning without authorization for now. However, pinning to Infura might fail sometimes. 

When pushing content to IPFS, the IPFS module of the SkyeKiwi Protocol will try to push content to SkyeKiwi IPFS, if the HTTP request fails,, it will fall back to Infura IPFS. If Infura IPFS fails again, it will fallback to start a local IPFS node, in that case, you will be required to keep the local IPFS node running, so that the Crust Network can fetch the file. It might take up to 2 hours for the Crust Network to pick up the file. Please refer to [Crust Wiki](https://wiki.crust.network/docs/en/storageUserGuide) for file fetching. 

Similarly, for `ipfs.cat`, it will first try to fetch through a list of public IPFS gatewey, if failed, it will try to use an Infura ipfs gateway, if failed again, use SkyeKiwi IPFS Gateway, if failed again, it will fall back to a local node. 

If an `ERR_LOCK_EXISTS` appears on `jsipfs`, it is because that you are trying to start another local IPFS node when there is already one running. Run `await ipfs.stopIfRunning()` to stop the local IPFS node. `stopIfRunning` will always do checks and if there is actually a local node running, if not, it will not do anything. Therefore, if a local IPFS node is not needed, always run `await ipfs.stopIfRunning()`. 


### Project Structure 
```
.
├── LICENSE
├── README.md
├── abi // where all smart contract information is stored
│   ├── skyekiwi.contract
│   └── skyekiwi.json
├── browser.test // run index.html to run tests in browsers
│   ├── index.html 
│   ├── test.browser.js // generated by Webpack to include all tests
│   └── test.browser.js.LICENSE.txt
├── dist
│   ├── src // compiled by TSC of src
|   | .... 
│   |── test // compiled by TSC of test
│   └── .....
├── src
│   ├── Blockchain // blockchain adapter
│   │   ├── Contract.ts // interact with smart contract
│   │   ├── Crust.ts // interact with the Crust Network
│   │   ├── Util.ts
│   │   └── index.ts
│   ├── Encryption // cryptographic module
│   │   ├── AsymmetricEncryption.ts
│   │   ├── SymmetricEncryption.ts
│   │   ├── TSS.ts
│   │   └── index.ts
│   ├── File
│   │   └── index.ts
│   ├── IPFS
│   │   └── index.ts
│   ├── Metadata // core metadata packager
│   │   ├── EncryptionSchema.ts
│   │   ├── Seal.ts
│   │   └── index.ts
│   ├── Util
│   │   └── index.ts
│   ├── driver.ts // Driver module that export "upstream", "donwstream" and "updateEncryptionSchema"
│   └── index.ts
├── test // tests
│   ├── blockchain.test.ts
│   ├── encryption.test.ts
│   ├── file.test.ts
│   ├── index.ts // include all tests / used for browser
│   ├── integration.test.ts
│   ├── ipfs.test.ts
│   ├── setup.ts
│   └── tmp // temporary folder for generated files when tested on Node.js
├── package.json
├── tsconfig.json
├── tslint.json
├── webpack.config.js
└── yarn.lock
```


### LICENSE

Apache 2.0. See the `LICNESE` File. 

### Contact 
Email: hello@skye.kiwi <br/>
Telegram: @songzhou26
