// Ported from 
// https://github.com/crustio/crust.js/blob/main/packages/crust-pin/src/util.ts
// With minor modifications
// Licensed under Apache-2.0


/* eslint-disable node/no-extraneous-import */
import { KeyringPair } from '@polkadot/keyring/types';

/**
 * Send tx to Crust Network
 * @param {SubmittableExtrinsic} tx substrate-style tx
 * @param {string} seeds tx already been sent
 */
export async function sendTx(
  extrinsic: any,
  signer: KeyringPair,
  logging?: boolean
): Promise<boolean> {
  logging = logging === undefined ? false : logging

  if (logging)
  console.log('⛓  Send tx to chain...');

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(signer, ({ events = [], status }) => {
      if (logging)
      console.log(
        `  ↪ 💸  Transaction status: ${status.type}, nonce: ${extrinsic.nonce}`
      );

      if (
        status.isInvalid ||
        status.isDropped ||
        status.isUsurped ||
        status.isRetracted
      ) {
        reject(new Error('Invalid transaction'));
      } else {
        // Pass it
      }

      if (status.isInBlock) {
        events.forEach(({ event: { method, section } }) => {
          if (section === 'system' && method === 'ExtrinsicFailed') {
            // Error with no detail, just return error
            console.error(`  ↪ ❌  Send transaction(${extrinsic.type}) failed.`);
            resolve(false);
          } else if (method === 'ExtrinsicSuccess') {
            if (logging)
            console.log(`  ↪ ✅  Send transaction(${extrinsic.type}) success.`);
            resolve(true);
          }
        });
      } else {
        // Pass it
      }
    }).catch(e => {
      reject(e);
    });
  });
}
