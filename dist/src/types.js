"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileChunk = exports.Metadata = exports.EncryptionSchema = void 0;
class EncryptionSchema {
    constructor(pieces, quorum, publicPieceCount, metadata_ipfs, public_pieces_ipfs, members) {
        this.pieces = pieces;
        this.quorum = quorum;
        this.publicPieceCount = publicPieceCount;
        this.metadata_ipfs = metadata_ipfs;
        this.public_pieces_ipfs = public_pieces_ipfs;
        this.members = members;
    }
}
exports.EncryptionSchema = EncryptionSchema;
class Metadata {
    constructor(name, note, nonce, encryptionSchema, publicShares, pieces) {
        this.name = name;
        this.note = note;
        this.nonce = nonce;
        this.encryptionSchema = encryptionSchema;
        this.publicShares = publicShares;
        this.pieces = pieces;
    }
}
exports.Metadata = Metadata;
class FileChunk {
    constructor(file, hexContent, rawContent) {
        this.file = file;
        this.hexContent = hexContent;
        this.rawContent = rawContent;
    }
}
exports.FileChunk = FileChunk;
//# sourceMappingURL=types.js.map