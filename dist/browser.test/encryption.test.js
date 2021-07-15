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
Object.defineProperty(exports, "__esModule", { value: true });
const SkyeKiwi = __importStar(require("../src/index"));
const chai_1 = require("chai");
const tweetnacl_1 = require("tweetnacl");
describe('Encryption', () => {
    const key = tweetnacl_1.randomBytes(32);
    const symmetric = new SkyeKiwi.SecretBox(key);
    const asymmetric = new SkyeKiwi.Box(key);
    const message = '123456780123456';
    const message_u8a = SkyeKiwi.Util.stringToU8a(message);
    it('Symmetric: Encryption & Decryption Works', () => {
        const encrypted = symmetric.encrypt(message_u8a);
        const decrypted = SkyeKiwi.SecretBox.decrypt(key, encrypted);
        const decrypted_string = SkyeKiwi.Util.u8aToString(decrypted);
        chai_1.expect(decrypted_string).to.equal(message);
    });
    it('Asymmetric: Encryption & Decryption Works', () => {
        const receiver_privateKey = tweetnacl_1.randomBytes(32);
        const receiver_publicKey = SkyeKiwi.Box.getPublicKeyFromPrivateKey(receiver_privateKey);
        const sender_publicKey = asymmetric.getPublicKey();
        const encrypted = asymmetric.encrypt(message_u8a, receiver_publicKey);
        const decrypted = SkyeKiwi.Box.decrypt(encrypted, receiver_privateKey, sender_publicKey);
        const decrypted_string = SkyeKiwi.Util.u8aToString(decrypted);
        chai_1.expect(decrypted_string).to.equal(message);
    });
    it('Symmetric: Decryption Fails w/Wrong Key', () => {
        const wrong_key = tweetnacl_1.randomBytes(32);
        const encrypted = symmetric.encrypt(message_u8a);
        chai_1.expect(() => SkyeKiwi.SecretBox.decrypt(wrong_key, encrypted)).to.throw("decryption failed - SecretBox.decrypt");
    });
    it('Asymmetric: Decryption Fails w/Wrong Key', () => {
        const receiver_privateKey = tweetnacl_1.randomBytes(32);
        const receiver_publicKey = SkyeKiwi.Box.getPublicKeyFromPrivateKey(receiver_privateKey);
        const sender_publicKey = asymmetric.getPublicKey();
        const encrypted = asymmetric.encrypt(message_u8a, receiver_publicKey);
        // wrong sender's public key
        // the receiver's public key is sent instead of the sender's public key
        chai_1.expect(() => SkyeKiwi.Box.decrypt(encrypted, receiver_privateKey, receiver_publicKey)).to.throw('decryption failed - Box.decrypt');
        // wrong receiver's private key
        const wrong_private_key = tweetnacl_1.randomBytes(32);
        chai_1.expect(() => SkyeKiwi.Box.decrypt(encrypted, wrong_private_key, sender_publicKey)).to.throw('decryption failed - Box.decrypt');
    });
    it('TSS: Sharing Works', () => {
        const shares = SkyeKiwi.TSS.generateShares(message_u8a, 5, 3);
        chai_1.expect(shares.length).to.equal(5);
        chai_1.expect(SkyeKiwi.Util.u8aToHex(SkyeKiwi.TSS.recover(shares)))
            .to.equal(SkyeKiwi.Util.u8aToHex(message_u8a));
        // delete the last peice of share, it should still be able to recover
        shares.pop();
        chai_1.expect(SkyeKiwi.Util.u8aToHex(SkyeKiwi.TSS.recover(shares)))
            .to.equal(SkyeKiwi.Util.u8aToHex(message_u8a));
        // 3 shares should also be able to decrypt
        shares.pop();
        chai_1.expect(SkyeKiwi.Util.u8aToHex(SkyeKiwi.TSS.recover(shares)))
            .to.equal(SkyeKiwi.Util.u8aToHex(message_u8a));
        // less than 3 shares will fail 
        shares.pop();
        chai_1.expect(() => SkyeKiwi.TSS.recover(shares)).to.throw('decryption failed, most likely because threshold is not met - TSS.recover');
        shares.pop();
        chai_1.expect(() => SkyeKiwi.TSS.recover(shares)).to.throw('decryption failed, most likely because threshold is not met - TSS.recover');
    });
});
//# sourceMappingURL=encryption.test.js.map