"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKYEKIWI_SECRETS_ENDING = exports.TSS = void 0;
const secrets_1 = __importDefault(require("@skyekiwi/secrets"));
const index_1 = require("../index");
// 32 bytes
const SKYEKIWI_SECRETS_ENDING = "1122334455667788990011223344556677889900112233445566778899002619";
exports.SKYEKIWI_SECRETS_ENDING = SKYEKIWI_SECRETS_ENDING;
// TODO: secret.js needs to be replaced by a better impl
// the padding issue is stupid
// secret.js gives a hex string that has 
// half byte BITS + 1 bytes ID + N bytes of value 
// the half byte cannot be parse to U8A correctly 
class TSS {
    static generateShares(message, numShares, threshold) {
        const messageHexString = index_1.Util.u8aToHex(message);
        const wrappedMessageHexString = messageHexString + SKYEKIWI_SECRETS_ENDING;
        // Proceed with TSS
        const shares = secrets_1.default.share(wrappedMessageHexString, numShares, threshold);
        // get rid of the BITS field, where they create wrong u8a
        // it should be set by default to 8. 
        // I cannot think of a chance if the below error can be thrown, 
        // given the secret.js params is not changes
        const derivedSharing = shares.map(share => {
            if (share[0] != '8') {
                throw new Error('finite field broken somehow - TSS.generateShares');
            }
            return share.slice(1);
        });
        const shares_u8a = derivedSharing.map(index_1.Util.hexToU8a);
        return shares_u8a;
    }
    static recover(shares) {
        const sharesInHexString = shares.map(index_1.Util.u8aToHex);
        // Recover by TSS
        // similar to shares generation, reverse the process by putting back the BITS
        const wrappedResult = secrets_1.default.combine(sharesInHexString.map(share => '8' + share));
        if (wrappedResult.slice(wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length)
            !== SKYEKIWI_SECRETS_ENDING) {
            throw new Error("decryption failed, most likely because threshold is not met - TSS.recover");
        }
        return index_1.Util.hexToU8a(wrappedResult.slice(0, wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length));
    }
}
exports.TSS = TSS;
//# sourceMappingURL=TSS.js.map