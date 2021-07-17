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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SkyeKiwi = __importStar(require("../src/index"));
const util_crypto_1 = require("@polkadot/util-crypto");
const chai_1 = require("chai");
const tweetnacl_1 = require("tweetnacl");
const fs_1 = __importDefault(require("fs"));
require('dotenv').config();
const { setup, downstreamPath, cleanup } = require('./setup');
describe('Integration', function () {
    this.timeout(0);
    let vaultId1;
    let vaultId2;
    const mnemonic = process.env.SEED_PHRASE;
    const blockchain = new SkyeKiwi.Blockchain(
    // seed phrase
    mnemonic, 
    // contract address
    '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg', 
    // contract instance endpoint
    'wss://ws.jupiter-poa.patract.cn', 
    // storage network endpoint
    'wss://rocky-api.crust.network/');
    // generate 3 files
    let fileHandle;
    before(async () => {
        fileHandle = await setup(3);
    });
    after(async () => {
        await cleanup();
    });
    it('upstream, author only', async () => {
        const mnemonic = process.env.SEED_PHRASE;
        const author = SkyeKiwi.AsymmetricEncryption.getPublicKey(util_crypto_1.mnemonicToMiniSecret(mnemonic));
        const encryptionSchema = new SkyeKiwi.EncryptionSchema({
            numOfShares: 2,
            threshold: 2,
            author: author,
            unencryptedPieceCount: 1
        });
        encryptionSchema.addMember(author, 1);
        const key = new SkyeKiwi.Seal({
            encryptionSchema: encryptionSchema,
            seed: mnemonic
        });
        vaultId1 = await SkyeKiwi.Driver.upstream({
            file: fileHandle[0].file,
            seal: key,
            blockchain: blockchain
        });
    });
    it('downstream, author only', async () => {
        await SkyeKiwi.Driver.downstream({
            vaultId: vaultId1,
            blockchain: blockchain,
            outputPath: downstreamPath(0),
            keys: [util_crypto_1.mnemonicToMiniSecret(mnemonic)]
        });
        const downstreamContent = fs_1.default.readFileSync(downstreamPath(0));
        chai_1.expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[0].content))).to.equal(0);
    });
    const privateKey1 = tweetnacl_1.randomBytes(32);
    const privateKey2 = tweetnacl_1.randomBytes(32);
    const publicKey1 = SkyeKiwi.AsymmetricEncryption.getPublicKey(privateKey1);
    const publicKey2 = SkyeKiwi.AsymmetricEncryption.getPublicKey(privateKey2);
    it('upstream, two members + author', async () => {
        const mnemonic = process.env.SEED_PHRASE;
        const author = SkyeKiwi.AsymmetricEncryption.getPublicKey(util_crypto_1.mnemonicToMiniSecret(mnemonic));
        // Author can decrypt
        // two members can decrypt together but not by themselves
        const encryptionSchema = new SkyeKiwi.EncryptionSchema({
            numOfShares: 5,
            threshold: 3,
            author: author,
            unencryptedPieceCount: 1
        });
        encryptionSchema.addMember(author, 2);
        encryptionSchema.addMember(publicKey1, 1);
        encryptionSchema.addMember(publicKey2, 1);
        const key = new SkyeKiwi.Seal({
            encryptionSchema: encryptionSchema,
            seed: mnemonic
        });
        vaultId2 = await SkyeKiwi.Driver.upstream({
            file: fileHandle[1].file,
            seal: key,
            blockchain: blockchain
        });
    });
    it('downstream, two members + author', async () => {
        // Author can decrypt
        // await SkyeKiwi.Driver.downstream(
        //   vaultId, blockchain, ipfs, mnemonic,
        //   downstreamPath, 
        //   [mnemonicToMiniSecret(mnemonic)]
        // )
        await SkyeKiwi.Driver.downstream({
            vaultId: vaultId2,
            blockchain: blockchain,
            outputPath: downstreamPath(1),
            keys: [privateKey1, privateKey2]
        });
        const downstreamContent = fs_1.default.readFileSync(downstreamPath(1));
        chai_1.expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[1].content))).to.equal(0);
    });
    // `vaultId1` is a vault with only the author can read
    it('update encryptionSchema & downstream again', async () => {
        const mnemonic = process.env.SEED_PHRASE;
        const author = SkyeKiwi.AsymmetricEncryption.getPublicKey(util_crypto_1.mnemonicToMiniSecret(mnemonic));
        // updated encryptionSchema
        // Author can decrypt
        // two members can decrypt together but not by themselves
        const encryptionSchema = new SkyeKiwi.EncryptionSchema({
            numOfShares: 5,
            threshold: 3,
            author: author,
            unencryptedPieceCount: 1
        });
        encryptionSchema.addMember(author, 2);
        encryptionSchema.addMember(publicKey1, 1);
        encryptionSchema.addMember(publicKey2, 1);
        await SkyeKiwi.Driver.updateEncryptionSchema({
            vaultId: vaultId1,
            newEncryptionSchema: encryptionSchema,
            seed: mnemonic,
            keys: [util_crypto_1.mnemonicToMiniSecret(mnemonic)],
            blockchain: blockchain
        });
        await SkyeKiwi.Driver.downstream({
            vaultId: vaultId1,
            blockchain: blockchain,
            outputPath: downstreamPath(3),
            keys: [privateKey1, privateKey2]
        });
        const downstreamContent = fs_1.default.readFileSync(downstreamPath(3));
        chai_1.expect(Buffer.compare(downstreamContent, Buffer.from(fileHandle[0].content))).to.equal(0);
    });
});
//# sourceMappingURL=integration.test.js.map