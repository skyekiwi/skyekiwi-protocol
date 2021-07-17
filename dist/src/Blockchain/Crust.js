"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crust = void 0;
const index_1 = require("./index");
class Crust {
    constructor(signer, api) {
        this.signer = signer;
        this.api = api;
    }
    async placeOrder(cid, size, tip) {
        await this.api.isReadyOrError;
        return await index_1.sendTx(this.api.tx.market.placeStorageOrder(cid, size, tip ? tip : 0), this.signer);
    }
    async placeBatchOrderWithCIDList(cidList, tip) {
        let extrinsicQueue = [];
        for (let cid of cidList) {
            extrinsicQueue.push(this.api.tx.market.placeStorageOrder(cid.cid, cid.size, tip ? tip : 0));
        }
        const crustResult = await index_1.sendTx(this.api.tx.utility.batchAll(extrinsicQueue), this.signer);
        return crustResult;
    }
    async awaitNetworkFetching(cidList) {
        let cidQueue = [];
        for (let cid of cidList) {
            cidQueue.push(cid.cid);
        }
        while (cidQueue.length != 0) {
            // console.log(cidQueue)
            const result = [];
            for (let i = 0; i < cidQueue.length; i++) {
                const status = await this.api.query.market.files(cidQueue[i]);
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
    }
    // size in term of bytes
    async getStoragePrice(size) {
        const unitPricePerMB = await this.api.query.market.filePrice();
        const price = parseInt(unitPricePerMB.toHex());
        return price * size / 1024;
    }
}
exports.Crust = Crust;
//# sourceMappingURL=Crust.js.map