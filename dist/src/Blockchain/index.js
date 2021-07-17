"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = exports.Crust = exports.sendTx = exports.Blockchain = void 0;
const Util_1 = require("./Util");
Object.defineProperty(exports, "sendTx", { enumerable: true, get: function () { return Util_1.sendTx; } });
const Crust_1 = require("./Crust");
Object.defineProperty(exports, "Crust", { enumerable: true, get: function () { return Crust_1.Crust; } });
const Contract_1 = require("./Contract");
Object.defineProperty(exports, "Contract", { enumerable: true, get: function () { return Contract_1.Contract; } });
const api_contract_1 = require("@polkadot/api-contract");
const wasm_crypto_1 = require("@polkadot/wasm-crypto");
const api_1 = require("@polkadot/api");
const type_definitions_1 = require("@crustio/type-definitions");
const keyring_1 = require("@polkadot/keyring");
class Blockchain {
    constructor(seed, contract_address, contract_endpoint, crust_endpoint, types) {
        this.seed = seed;
        this.contract_address = contract_address;
        this.contract_endpoint = contract_endpoint;
        this.crust_endpoint = crust_endpoint;
        this.types = types;
        this.isReady = false;
        types = types ? types : {
            "LookupSource": "MultiAddress",
            "Address": "MultiAddress",
            "AccountInfo": "AccountInfoWithTripleRefCount",
            "AliveContractInfo": {
                "trieId": "TrieId",
                "storageSize": "u32",
                "pairCount": "u32",
                "codeHash": "CodeHash",
                "rentAllowance": "Balance",
                "rentPayed": "Balance",
                "deductBlock": "BlockNumber",
                "lastWrite": "Option<BlockNumber>",
                "_reserved": "Option<Null>"
            },
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
            }, "Error": {
                _enum: ['VaultIdError', 'AccessDenied', 'MetadataNotValid', 'MathError']
            },
        };
    }
    async init() {
        if (this.isReady)
            return;
        await wasm_crypto_1.waitReady();
        const keyring = (new keyring_1.Keyring({
            type: 'sr25519',
        })).addFromUri(this.seed);
        let crust_api = new api_1.ApiPromise({
            provider: new api_1.WsProvider(this.crust_endpoint),
            typesBundle: type_definitions_1.typesBundleForPolkadot,
        });
        crust_api = await crust_api.isReadyOrError;
        let contract_api = new api_1.ApiPromise({
            provider: new api_1.WsProvider(this.contract_endpoint),
            types: this.types,
        });
        contract_api = await contract_api.isReadyOrError;
        let contract_instance = new api_contract_1.ContractPromise(
        // @ts-ignore
        contract_api, Util_1.getAbi(), this.contract_address);
        this.contract = new Contract_1.Contract(keyring, contract_instance);
        this.storage = new Crust_1.Crust(keyring, crust_api);
        this.isReady = true;
    }
}
exports.Blockchain = Blockchain;
//# sourceMappingURL=index.js.map