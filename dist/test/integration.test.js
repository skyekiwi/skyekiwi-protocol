"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SkyeKiwi = __importStar(require("../src/index"));
const util_crypto_1 = require("@polkadot/util-crypto");
const chai_1 = require("chai");
const fs_1 = __importDefault(require("fs"));
const tweetnacl_1 = require("tweetnacl");
require('dotenv').config();
const { setup, downstreamPath, cleanup } = require('./setup.ts');
describe('Integration', function () {
    this.timeout(0);
    let vaultId1;
    let vaultId2;
    const abi = SkyeKiwi.getAbi();
    const mnemonic = process.env.SEED_PHRASE;
    const blockchain = new SkyeKiwi.Blockchain(
    // seed phrase
    mnemonic, 
    // contract address
    '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg', 
    // contract instance endpoint
    'wss://ws.jupiter-poa.patract.cn', 
    // storage network endpoint
    'wss://rocky-api.crust.network/', 
    // contract abi
    abi);
    // generate 3 files
    let fileHandle;
    before(() => __awaiter(this, void 0, void 0, function* () {
        fileHandle = yield setup(3);
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
        yield cleanup();
    }));
    it('upstream, author only', () => __awaiter(this, void 0, void 0, function* () {
        const mnemonic = process.env.SEED_PHRASE;
        const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(util_crypto_1.mnemonicToMiniSecret(mnemonic));
        const ipfs = new SkyeKiwi.IPFS();
        const encryptionSchema = new SkyeKiwi.EncryptionSchema(2, 2, author, 1);
        encryptionSchema.addMember(author, 1);
        const key = new SkyeKiwi.Seal(encryptionSchema, mnemonic);
        const skyekiwi = new SkyeKiwi.Driver(encryptionSchema, fileHandle[0].file, key, ipfs, blockchain);
        vaultId1 = yield skyekiwi.upstream();
        yield ipfs.stopIfRunning();
    }));
    it('downstream, author only', () => __awaiter(this, void 0, void 0, function* () {
        const ipfs = new SkyeKiwi.IPFS();
        yield SkyeKiwi.Driver.downstream(vaultId1, blockchain, ipfs, downstreamPath(0), [util_crypto_1.mnemonicToMiniSecret(mnemonic)]);
        const downstreamContent = fs_1.default.readFileSync(downstreamPath(0));
        chai_1.expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[0].content))).to.equal(0);
        yield ipfs.stopIfRunning();
    }));
    const privateKey1 = tweetnacl_1.randomBytes(32);
    const privateKey2 = tweetnacl_1.randomBytes(32);
    const publicKey1 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey1);
    const publicKey2 = SkyeKiwi.Box.getPublicKeyFromPrivateKey(privateKey2);
    it('upstream, two members + author', () => __awaiter(this, void 0, void 0, function* () {
        const mnemonic = process.env.SEED_PHRASE;
        const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(util_crypto_1.mnemonicToMiniSecret(mnemonic));
        const ipfs = new SkyeKiwi.IPFS();
        // Author can decrypt
        // two members can decrypt together but not by themselves
        const encryptionSchema = new SkyeKiwi.EncryptionSchema(5, 3, author, 1);
        encryptionSchema.addMember(author, 2);
        encryptionSchema.addMember(publicKey1, 1);
        encryptionSchema.addMember(publicKey2, 1);
        const key = new SkyeKiwi.Seal(encryptionSchema, mnemonic);
        const skyekiwi = new SkyeKiwi.Driver(encryptionSchema, fileHandle[1].file, key, ipfs, blockchain);
        vaultId2 = yield skyekiwi.upstream();
        yield ipfs.stopIfRunning();
    }));
    it('downstream, two members + author', () => __awaiter(this, void 0, void 0, function* () {
        const ipfs = new SkyeKiwi.IPFS();
        // Author can decrypt
        // await SkyeKiwi.Driver.downstream(
        //   vaultId, blockchain, ipfs, mnemonic,
        //   downstreamPath, 
        //   [mnemonicToMiniSecret(mnemonic)]
        // )
        yield SkyeKiwi.Driver.downstream(vaultId2, blockchain, ipfs, downstreamPath(1), [privateKey1, privateKey2]);
        const downstreamContent = fs_1.default.readFileSync(downstreamPath(1));
        chai_1.expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[1].content))).to.equal(0);
        yield ipfs.stopIfRunning();
    }));
    // `vaultId1` is a vault with only the author can read
    it('update encryptionSchema & downstream again', () => __awaiter(this, void 0, void 0, function* () {
        const mnemonic = process.env.SEED_PHRASE;
        const author = SkyeKiwi.Box.getPublicKeyFromPrivateKey(util_crypto_1.mnemonicToMiniSecret(mnemonic));
        const ipfs = new SkyeKiwi.IPFS();
        // updated encryptionSchema
        // Author can decrypt
        // two members can decrypt together but not by themselves
        const encryptionSchema = new SkyeKiwi.EncryptionSchema(5, 3, author, 1);
        encryptionSchema.addMember(author, 2);
        encryptionSchema.addMember(publicKey1, 1);
        encryptionSchema.addMember(publicKey2, 1);
        yield SkyeKiwi.Driver.updateEncryptionSchema(vaultId1, encryptionSchema, mnemonic, [util_crypto_1.mnemonicToMiniSecret(mnemonic)], ipfs, blockchain);
        yield ipfs.stopIfRunning();
        yield SkyeKiwi.Driver.downstream(vaultId1, blockchain, new SkyeKiwi.IPFS(), downstreamPath(3), [privateKey1, privateKey2]);
        const downstreamContent = fs_1.default.readFileSync(downstreamPath(3));
        chai_1.expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[0].content))).to.equal(0);
        yield ipfs.stopIfRunning();
    }));
});
//# sourceMappingURL=integration.test.js.map