"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionSchema = void 0;
class EncryptionSchema {
    constructor(config) {
        this.members = [];
        this.numOfShares = config.numOfShares;
        this.threshold = config.threshold;
        this.author = config.author;
        this.unencryptedPieceCount = config.unencryptedPieceCount;
    }
    getNumOfParticipants() {
        // get all unique publicKey in this.members and 
        // that's the number of participants 
        return (this.members)
            .filter((item, index, array) => array.indexOf(item) === index)
            .length;
    }
    // 
    addMember(memberPublicKey, shares) {
        for (let i = 0; i < shares; i++)
            this.members.push(memberPublicKey);
    }
}
exports.EncryptionSchema = EncryptionSchema;
//# sourceMappingURL=EncryptionSchema.js.map