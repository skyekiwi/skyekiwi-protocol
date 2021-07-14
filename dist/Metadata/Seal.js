"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seal = void 0;
const index_1 = require("../index");
const tweetnacl_1 = require("tweetnacl");
const util_crypto_1 = require("@polkadot/util-crypto");
class Seal {
    constructor(encryptionSchema, mnemonic, sealingKey) {
        if (!mnemonic) {
            mnemonic = util_crypto_1.mnemonicGenerate();
        }
        this.mnemonic = mnemonic;
        // if no secretBoxKey supplied, generate a random key
        this.sealingKey = sealingKey ? sealingKey : tweetnacl_1.randomBytes(32);
        // mnemonic has 12 words
        if (mnemonic.split(' ').length !== 12) {
            throw new Error('mnemonic length error - Seal.constructor');
        }
        // SecretBoxKey is 32 bytes long
        if (sealingKey && sealingKey.length !== 32) {
            throw new Error('SecretBox key length error, should be 32 bytes long - Seal.contructor');
        }
        this.blockchainPrivateKey = util_crypto_1.mnemonicToMiniSecret(mnemonic);
        this.encryptionSchema = encryptionSchema;
        this.box = new index_1.Box(this.blockchainPrivateKey);
    }
    seal(message) {
        let public_shares = [];
        let private_shares = [];
        // pieces = public piece(s) + members' piece(s)
        if (this.encryptionSchema.numOfShares !==
            this.encryptionSchema.unencryptedPieceCount +
                this.encryptionSchema.members.length) {
            throw new Error("wrong encryptionSchema supplied - Seal.seal");
        }
        // quorum > pieces : a vault that can never be decrypt
        if (this.encryptionSchema.threshold > this.encryptionSchema.numOfShares) {
            throw new Error("wrong encryptionSchema supplied - Seal.seal");
        }
        this.encryptionSchema.author = this.box.getPublicKey();
        const shares = index_1.TSS.generateShares(message, this.encryptionSchema.numOfShares, this.encryptionSchema.threshold);
        for (let i = 0; i < this.encryptionSchema.unencryptedPieceCount; i++) {
            public_shares.push(shares.pop());
        }
        for (let index in this.encryptionSchema.members) {
            private_shares.push(this.box.encrypt(shares.pop(), this.encryptionSchema.members[index]));
        }
        let publicSharesHex = "";
        let privateSharesHex = "";
        for (let share of public_shares) {
            publicSharesHex += index_1.Util.u8aToHex(share) + "|";
        }
        publicSharesHex = index_1.Util.trimEnding(publicSharesHex);
        for (let share of private_shares) {
            privateSharesHex += index_1.Util.u8aToHex(share) + "|";
        }
        privateSharesHex = index_1.Util.trimEnding(privateSharesHex);
        return {
            "public": publicSharesHex,
            "private": privateSharesHex
        };
    }
    static recover(public_pieces, private_pieces, keys, orignalAuthor) {
        let shares = [];
        shares = [...public_pieces];
        for (let piece of private_pieces) {
            for (let key in keys) {
                try {
                    const decrypted = index_1.Box.decrypt(piece, keys[key], orignalAuthor);
                    if (decrypted)
                        shares.push(decrypted);
                }
                catch (err) {
                    // pass
                }
            }
        }
        return index_1.TSS.recover(shares);
    }
    getPublicSealingKey() {
        return index_1.Box.getPublicKeyFromPrivateKey(this.sealingKey);
    }
    getPublicAuthorKey() {
        return index_1.Box.getPublicKeyFromPrivateKey(this.blockchainPrivateKey);
    }
    digestEncryptionSchema() {
        return {
            'numOfShares': this.encryptionSchema.numOfShares,
            'threshold': this.encryptionSchema.threshold,
            'numOfParticipants': this.encryptionSchema.getNumOfParticipants(),
            'author': index_1.Util.u8aToHex(this.encryptionSchema.author)
        };
    }
}
exports.Seal = Seal;
//# sourceMappingURL=Seal.js.map