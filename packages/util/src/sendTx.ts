// Copyright 2021-2022 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { EventRecord } from '@polkadot/types/interfaces';

import { EventEmitter } from 'events';

// Ported from
// https://github.com/crustio/crust.js/blob/main/packages/crust-pin/src/util.ts
// With minor modifications
// Licensed under Apache-2.0

/* eslint-disable sort-keys */
export const txProgressText: {
  [key: string]: (arg0?: string) => string
} = {
  SENDING: () => '⛓  Send tx to chain...',
  TX_STATUS: (status: string) => `  ↪ 💸  Transaction status: ${status}`,
  TX_FAILED: (status: string) => `  ↪ ❌  Send transaction(${status}) failed.`,
  TX_SUCCESS: (status: string) => `  ↪ ✅  Send transaction(${status}) success.`
};
/* eslint-enable */

/**
 * Send tx on Substrate
 * @param {SubmittableExtrinsic} tx substrate-style tx
 * @param {string} seeds tx already been sent
 */
export const sendTx = (
  extrinsic: SubmittableExtrinsic,
  sender: KeyringPair,
  progress?: EventEmitter
): Promise<EventRecord[] | null> => {
  if (progress) progress.emit('progress', 'SENDING', null);

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(sender, ({ events = [], status }) => {
      if (progress) progress.emit('progress', 'TX_STATUS', status.type);

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
            if (progress) progress.emit('progress', 'TX_FAILED', extrinsic.type);
            resolve(null);
          } else if (method === 'ExtrinsicSuccess') {
            if (progress) progress.emit('progress', 'TX_SUCCESS', extrinsic.type);
            resolve(events);
          }
        });
      } else {
        // Pass it
      }
    }).catch(reject);
  });
};
