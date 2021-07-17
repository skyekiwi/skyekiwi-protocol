"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsymmetricEncryption = void 0;
const tweetnacl_1 = require("tweetnacl");
class AsymmetricEncryption {
    static getPublicKey(secretKey) {
        return tweetnacl_1.box.keyPair.fromSecretKey(secretKey).publicKey;
    }
    static encrypt(key, message, receiverPublicKey) {
        const nonce = tweetnacl_1.randomBytes(tweetnacl_1.box.nonceLength);
        const encrypted = tweetnacl_1.box(message, nonce, receiverPublicKey, key);
        const fullMessage = new Uint8Array(nonce.length + encrypted.length);
        fullMessage.set(nonce);
        fullMessage.set(encrypted, nonce.length);
        return fullMessage;
    }
    static decrypt(privateKey, messageWithNonce, senderPublicKey) {
        const nonce = messageWithNonce.slice(0, tweetnacl_1.box.nonceLength);
        const message = messageWithNonce.slice(tweetnacl_1.box.nonceLength, messageWithNonce.length);
        const decrypted = tweetnacl_1.box.open(message, nonce, senderPublicKey, privateKey);
        if (!decrypted) {
            throw new Error('decryption failed - Box.decrypt');
        }
        return decrypted;
    }
}
exports.AsymmetricEncryption = AsymmetricEncryption;
//# sourceMappingURL=AsymmetricEncryption.js.map