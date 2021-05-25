import { RedspotUserConfig } from 'redspot/types';
import '@redspot/patract';
import '@redspot/chai';
import '@redspot/gas-reporter';
require('dotenv').config();

export default {
  defaultNetwork: 'development',
  contract: {
    ink: {
      toolchain: 'nightly',
      sources: ['contracts/**/*']
    }
  },
  networks: {
    development: {
      endpoint: 'ws://127.0.0.1:9944',
      types: {
        "LookupSource": "MultiAddress",
        "Address": "MultiAddress",
        "FullIdentification": "AccountId",
        "AuthorityState": {
          "_enum": [
            "Working",
            "Waiting"
          ]
        },
        "EraIndex": "u32",
        "ActiveEraInfo": {
          "index": "EraIndex",
          "start": "Option<u64>"
        },
        "UnappliedSlash": {
          "validator": "AccountId",
          "reporters": "Vec<AccountId>"
        }, Error: {
          _enum: ['VaultIdError', 'AccessDenied', 'MetadataNotValid', 'MathError']
        }, 
      },
      gasLimit: '400000000000',
      explorerUrl: 'https://polkadot.js.org/apps/#/explorer/query/',
    },
    jupiter: {
      endpoint: 'wss://jupiter-poa.elara.patract.io',
      gasLimit: '400000000000',
      accounts: [process.env.SEED_PHRASE],
      types: {
        "LookupSource": "MultiAddress",
        "Address": "MultiAddress",
        "FullIdentification": "AccountId",
        "AuthorityState": {
          "_enum": [
            "Working",
            "Waiting"
          ]
        },
        "EraIndex": "u32",
        "ActiveEraInfo": {
          "index": "EraIndex",
          "start": "Option<u64>"
        },
        "UnappliedSlash": {
          "validator": "AccountId",
          "reporters": "Vec<AccountId>"
        }, Error: {
          _enum: ['VaultIdError', 'AccessDenied', 'MetadataNotValid', 'MathError']
        },
      },
    }
  },
  mocha: {
    timeout: 180000
  }
} as RedspotUserConfig;
