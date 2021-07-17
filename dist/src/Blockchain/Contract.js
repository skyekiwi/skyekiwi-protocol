"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = void 0;
const index_1 = require("./index");
class Contract {
    constructor(signer, instance) {
        this.signer = signer;
        this.instance = instance;
    }
    async execContract(message, params) {
        // "the dirty method" as in https://github.com/patractlabs/redspot/issues/78
        const execResult = await this.queryContract(message, params);
        const extrinsic = await this.instance.tx[message]({ gasLimit: -1 }, ...params);
        const txResult = await index_1.sendTx(extrinsic, this.signer);
        if (txResult) {
            return execResult.output?.toJSON();
        }
        else
            return txResult;
    }
    async queryContract(message, params) {
        // @ts-ignore
        return (await this.instance.query[message](this.signer.address, { gasLimit: -1 }, ...params));
    }
}
exports.Contract = Contract;
//# sourceMappingURL=Contract.js.map