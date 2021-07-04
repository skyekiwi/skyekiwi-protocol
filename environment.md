# Environment Setup  

## Install Node.js

please reference to [Node.js Website](https://nodejs.org/en/download/) 

- We recommend you to install [yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable) as an alternative to `npm` . Simple run `npm install --global yarn` 

- The repo is tested with nodejs version `14.6.0` , to check on your nodejs version `node -v` , to switch version of node, I recommend using [n](https://github.com/tj/n) by TJ. 


## WASM Smart Contract Environment
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


4. Grab a local Substrate blockchain node with `pallet-contract` included. There are many options: [jupiter](https://github.com/patractlabs/jupiter) is the one we choose. Alternatively, you can get [canvas](https://github.com/paritytech/canvas-node) by Parity. `Rust` is known for compiling slowly. It might take an hour to compile [jupiter](https://github.com/patractlabs/jupiter). 

    - To use [jupiter](https://github.com/patractlabs/jupiter), follow this [guide](https://github.com/patractlabs/jupiter#compile-and-run).  

    - To use [canvas](https://github.com/paritytech/canvas-node), follow this [guide](https://substrate.dev/substrate-contracts-workshop/#/0/setup?id=installing-the-canvas-node). 
    
    - Lastly, fire up the local blockchain 

        ```
        path-to-jupiter-repo/target/release/jupiter-prep --dev
        # OR with Canvas
        canvas --dev --tmp
        ```

        You can visit https://ipfs.io/ipns/dotapps.io and choose to connect to `ws://127.0.0.1:9944` to have a visual portal to interact with the blockchain.

## Tested Versions

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
