// Copyright 2021 - 2022 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import type { EventRecord } from '@polkadot/types/interfaces';

import type { Signer } from '@polkadot/api/types';
import type { KeyringPair } from '@polkadot/keyring/types';

// Ported from
// https://github.com/crustio/crust.js/blob/main/packages/crust-pin/src/util.ts
// With minor modifications
// Licensed under Apache-2.0

/**
 * Send tx on Substrate
 * @param {SubmittableExtrinsic} tx substrate-style tx
 * @param {string} seeds tx already been sent
 */
const sendTx = (
  extrinsic: SubmittableExtrinsic,
  sender: string | KeyringPair,
  signer?: Signer,
  logging?: boolean
): Promise<EventRecord[] | null> => {
  logging = logging === undefined ? false : logging;

  if (logging) { console.log('⛓  Send tx to chain...'); }

  const options = signer ? { signer: signer } : undefined;

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(sender, options, ({ events = [], status }) => {
      if (logging) {
        console.log(
          `  ↪ 💸  Transaction status: ${status.type}`
        );
      }

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
            resolve(null);
          } else if (method === 'ExtrinsicSuccess') {
            if (logging) { console.log(`  ↪ ✅  Send transaction(${extrinsic.type}) success.`); }

            resolve(events);
          }
        });
      } else {
        // Pass it
      }
    }).catch(reject);
  });
};

export { sendTx };
