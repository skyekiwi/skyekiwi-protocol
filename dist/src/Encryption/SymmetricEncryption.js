"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymmetricEncryption = void 0;
const tweetnacl_1 = require("tweetnacl");
class SymmetricEncryption {
    static encrypt(key, message) {
        const nonce = tweetnacl_1.randomBytes(tweetnacl_1.secretbox.nonceLength);
        const box = tweetnacl_1.secretbox(message, nonce, key);
        const fullMessage = new Uint8Array(nonce.length + box.length);
        fullMessage.set(nonce);
        fullMessage.set(box, nonce.length);
        return fullMessage;
    }
    static decrypt(key, messageWithNonce) {
        const nonce = messageWithNonce.slice(0, tweetnacl_1.secretbox.nonceLength);
        const message = messageWithNonce.slice(tweetnacl_1.secretbox.nonceLength, messageWithNonce.length);
        const decrypted = tweetnacl_1.secretbox.open(message, nonce, key);
        if (!decrypted) {
            throw new Error("decryption failed - SecretBox.decrypt");
        }
        return decrypted;
    }
}
exports.SymmetricEncryption = SymmetricEncryption;
//# sourceMappingURL=SymmetricEncryption.js.map