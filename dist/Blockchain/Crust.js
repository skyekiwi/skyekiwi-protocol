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
exports.Crust = void 0;
const index_1 = require("./index");
class Crust {
    constructor(signer, api) {
        this.signer = signer;
        this.api = api;
    }
    placeOrder(cid, size, tip) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.isReadyOrError;
            return yield index_1.sendTx(this.api.tx.market.placeStorageOrder(cid, size, tip ? tip : 0), this.signer);
        });
    }
    placeBatchOrderWithCIDList(cidList, tip) {
        return __awaiter(this, void 0, void 0, function* () {
            let extrinsicQueue = [];
            for (let cid of cidList) {
                extrinsicQueue.push(this.api.tx.market.placeStorageOrder(cid.cid, cid.size, tip ? tip : 0));
            }
            const crustResult = yield index_1.sendTx(this.api.tx.utility.batchAll(extrinsicQueue), this.signer);
            return crustResult;
        });
    }
    awaitNetworkFetching(cidList) {
        return __awaiter(this, void 0, void 0, function* () {
            let cidQueue = [];
            for (let cid of cidList) {
                cidQueue.push(cid.cid);
            }
            while (cidQueue.length != 0) {
                // console.log(cidQueue)
                const result = [];
                for (let i = 0; i < cidQueue.length; i++) {
                    const status = yield this.api.query.market.files(cidQueue[i]);
                    //@ts-ignore
                    result.push(status && status.reported_replica_count != 0);
                    console.log(status);
                }
                for (let i = 0; i < cidQueue.length; i++) {
                    if (result[i])
                        cidQueue[i] = "";
                }
                cidQueue = cidQueue.filter(cid => cid !== "");
                // cidQueue = cidQueue.filter(async cid => {
                //   const status = await this.api.query.market.files(cid);
                //   console.log(status)
                //   return status && status.reported_replica_count != 0
                // })
            }
        });
    }
    // size in term of bytes
    getStoragePrice(size) {
        return __awaiter(this, void 0, void 0, function* () {
            const unitPricePerMB = yield this.api.query.market.filePrice();
            const price = parseInt(unitPricePerMB.toHex());
            return price * size / 1024;
        });
    }
}
exports.Crust = Crust;
//# sourceMappingURL=Crust.js.map