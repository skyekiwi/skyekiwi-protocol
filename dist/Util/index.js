"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimEnding = exports.u8aToString = exports.stringToU8a = exports.numberPadding = exports.isValidHex = exports.u8aToHex = exports.hexToU8a = void 0;
const util_1 = require("@polkadot/util");
Object.defineProperty(exports, "stringToU8a", { enumerable: true, get: function () { return util_1.stringToU8a; } });
Object.defineProperty(exports, "u8aToString", { enumerable: true, get: function () { return util_1.u8aToString; } });
const hexToU8a = (hex) => {
    if (isValidHex(hex)) {
        return new Uint8Array(hex.match(/[0-9A-Fa-f]{1,2}/g).map(byte => parseInt(byte, 16)));
    }
    else {
        throw new Error("invalid hex string: Util.hexToU8a");
    }
};
exports.hexToU8a = hexToU8a;
const u8aToHex = bytes => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
exports.u8aToHex = u8aToHex;
const isValidHex = str => {
    return (str.length & 1) === 0 &&
        (/^[0-9A-Fa-f]*$/g).test(str);
};
exports.isValidHex = isValidHex;
const numberPadding = n => {
    return String(n).padStart(16, '0');
};
exports.numberPadding = numberPadding;
const trimEnding = (str) => {
    const len = str.length;
    if (str[len - 1] === '|' || str[len - 1] === '-' || str[len - 1] === ' ') {
        return str.substring(0, len - 1);
    }
    else
        return str;
};
exports.trimEnding = trimEnding;
//# sourceMappingURL=index.js.map