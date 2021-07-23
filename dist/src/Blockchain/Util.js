"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTx = exports.getAbi = void 0;
function getAbi() {
    try {
        return require('./skyekiwi.json');
    }
    catch (e) {
        try {
            return require('../../skyekiwi.json');
        }
        catch (e) {
            try {
                return require('../../abi/skyekiwi.json');
            }
            catch (e) {
                throw new Error("abi not found or misnamed. Looking for skyekiwi.json");
            }
        }
    }
}
exports.getAbi = getAbi;
/**
 * Send tx to Crust Network
 * @param {SubmittableExtrinsic} tx substrate-style tx
 * @param {string} seeds tx already been sent
 */
async function sendTx(extrinsic, signer, logging) {
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
}
exports.sendTx = sendTx;
//# sourceMappingURL=Util.js.map