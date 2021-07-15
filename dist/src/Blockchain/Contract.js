"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = void 0;
const index_1 = require("./index");
class Contract {
    constructor(signer, instance) {
        this.signer = signer;
        this.instance = instance;
    }
    execContract(message, params) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // "the dirty method" as in https://github.com/patractlabs/redspot/issues/78
            const execResult = yield this.queryContract(message, params);
            const extrinsic = yield this.instance.tx[message]({ gasLimit: -1 }, ...params);
            const txResult = yield index_1.sendTx(extrinsic, this.signer);
            if (txResult) {
                return (_a = execResult.output) === null || _a === void 0 ? void 0 : _a.toJSON();
            }
            else
                return txResult;
        });
    }
    queryContract(message, params) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return (yield this.instance.query[message](this.signer.address, { gasLimit: -1 }, ...params));
        });
    }
}
exports.Contract = Contract;
//# sourceMappingURL=Contract.js.map