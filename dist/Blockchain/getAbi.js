"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbi = void 0;
function getAbi() {
    try {
        return require('../../abi/skyekiwi.json');
    }
    catch (e) {
        throw new Error("abi not found or misnamed. Looking for skyekiwi.json");
        return null;
    }
}
exports.getAbi = getAbi;
//# sourceMappingURL=getAbi.js.map