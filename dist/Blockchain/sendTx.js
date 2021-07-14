"use strict";
// Ported from 
// https://github.com/crustio/crust.js/blob/main/packages/crust-pin/src/util.ts
// With minor modifications
// Licensed under Apache-2.0
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
exports.sendTx = void 0;
/**
 * Send tx to Crust Network
 * @param {SubmittableExtrinsic} tx substrate-style tx
 * @param {string} seeds tx already been sent
 */
function sendTx(extrinsic, signer, logging) {
    return __awaiter(this, void 0, void 0, function* () {
        logging = logging === undefined ? false : logging;
        if (logging)
            console.log('⛓  Send tx to chain...');
        return new Promise((resolve, reject) => {
            extrinsic.signAndSend(signer, ({ events = [], status }) => {
                if (logging)
                    console.log(`  ↪ 💸  Transaction status: ${status.type}, nonce: ${extrinsic.nonce}`);
                if (status.isInvalid ||
                    status.isDropped ||
                    status.isUsurped ||
                    status.isRetracted) {
                    reject(new Error('Invalid transaction'));
                }
                else {
                    // Pass it
                }
                if (status.isInBlock) {
                    events.forEach(({ event: { method, section } }) => {
                        if (section === 'system' && method === 'ExtrinsicFailed') {
                            // Error with no detail, just return error
                            console.error(`  ↪ ❌  Send transaction(${extrinsic.type}) failed.`);
                            resolve(false);
                        }
                        else if (method === 'ExtrinsicSuccess') {
                            if (logging)
                                console.log(`  ↪ ✅  Send transaction(${extrinsic.type}) success.`);
                            resolve(true);
                        }
                    });
                }
                else {
                    // Pass it
                }
            }).catch(e => {
                reject(e);
            });
        });
    });
}
exports.sendTx = sendTx;
//# sourceMappingURL=sendTx.js.map