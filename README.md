<img src="https://tva1.sinaimg.cn/large/008i3skNgy1gqz4uri7ckj33dl0otn1c.jpg" width="600px"/>

**NOTE:** This is a very early version of the SkyeKiwi Protocol. It is in heavy development. We will not advise anyone to use in production environment yet.

<br>
<div>
    <img src="https://s6.jpg.cm/2021/10/26/IzgUTy.jpg" width="40%" align="left"/>
    <img src="https://s6.jpg.cm/2021/10/26/IzfSV2.png" width="40%" align="left"/>
</div>
<br><br><br><br><br><br><br><br>

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

</p></details>

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

|Package Name|Description|Status|
|---|---|---|
|`@skyekiwi/crypto`|Cryptographic Primitives|Ready|
|`@skyekiwi/driver`|Core Driver of the protocol / exposed APIs|Ready|
|`@skyekiwi/file`|File stream wrapper|Ready. Alpha in Browsers|
|`@skyekiwi/ipfs`|IPFS Client wrapper|WIP but usable|
|`@skyekiwi/metadata`|Metadata Packaer|Ready & Mostly Freezed|
|`@skyekiwi/util`|Useful Utility Functions|Ready|
|`@skyekiwi/secret-registry`|Register your secret to the SkyeKiwi Network|Limited Capcbility but Usable|
|`@skyekiwi/wasm-contract`|Secret Registry: Substrate WASM Smart Contract connector|
|`@skyekiwi/crust-network`|The Crust Network Connector|Removed. Replaced w/Web3 Auth Gateways|

Please refer to the `package/driver/e2e.spec.ts` folder which contains test cases for common useage.

UPSTERAM
```javascript
const registry = new SecretRegistry(mnemonic, {});

const file = await setup(content);
const sealer = new DefaultSealer();

sealer.unlock(mnemonicToMiniSecret(mnemonic));

const encryptionSchema = new EncryptionSchema();

encryptionSchema.addMember(sealer.getAuthorKey());

const result = await Driver.upstream(
  file, sealer, encryptionSchema, registry
);
```

DOWNSTREAM
```javascript
const registry = new SecretRegistry(mnemonic, {});

const stream = fs.createWriteStream(downstreamPath, { flags: 'a' });
const sealer = new DefaultSealer();

sealer.unlock(mnemonicToMiniSecret(mnemonic));

await Driver.downstream(
  vaultId1, [mnemonicToMiniSecret(mnemonic)], registry, stream, sealer
);
```


UPDATE ENCRYPTION SCHEMA
```javascript
const result = await Driver.updateEncryptionSchema(
  vaultId1, newEncryptionSchema, [mnemonicToMiniSecret(mnemonic)], storage, registry, sealer
);
```

GENERATE & VERIFY PROOF OF ACCESS
```javascript
const sealer = new DefaultSealer();
sealer.key = mnemonicToMiniSecret(mnemonic);

const sig = await Driver.generateProofOfAccess(
  vaultId1, [mnemonicToMiniSecret(mnemonic)], registry, sealer,
  new Uint8Array([0x0, 0x1, 0x2, 0x3])
);

// should equals true
Driver.verifyProofOfAccess(sig)
```

### Run Test

1. Clone this repo to your local environment & install dependencies 

```bash
git clone git@github.com:skyekiwi/skyekiwi-protocol.git
yarn
```

2. Create `.env`  files at the project home directory and write your seed phrase to it

```
SEED_PHRASE = 'xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx'
```

NOTE: Use "//Alice" for seed (when the SkyeKiwi Network is still in `--dev` mode. ) Should be updated in the next few weeks. 

3. Run Tests. The process can take somewhere between 3minutes to 10 minutes, depends on network connection. 

```bash
yarn test
```

5. Relax. The test should be able to finish within 5 minutes.

### LICENSE

Apache 2.0. See the `LICNESE` File. 

### Contact 
Email: hello@skye.kiwi <br/>
Telegram: @skyekiwi


