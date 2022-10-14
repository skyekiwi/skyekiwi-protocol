// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { CombinedCipher, PublicKey, SecretKey } from './types';

import { AsymmetricEncryption } from '.';

export class Cipher {
  public static build (bytes: Uint8Array, recipients: PublicKey[]): CombinedCipher {
    const preRecipientLength = bytes.length + 33 + 16 + 24;
    const res = new Uint8Array(recipients.length * preRecipientLength);

    let offset = 0;

    for (const recipient of recipients) {
      res.set(
        AsymmetricEncryption.encryptWithCurveType(recipient.keyType, bytes, recipient.key),
        offset
      );

      offset += preRecipientLength;
    }

    return {
      bytes: res, dataLength: preRecipientLength
    };
  }

  public static parseWithKeys (cipher: CombinedCipher, keys: SecretKey[]): Uint8Array {
    // If dataLength == 0 then isPublic
    if (cipher.dataLength === 0) {
      return cipher.bytes;
    }

    let offset = 0;

    while (offset < cipher.bytes.length) {
      const bytes = cipher.bytes.slice(offset, offset + cipher.dataLength);

      for (const key of keys) {
        try {
          const maybeUnpad = ['sr25519', 'ed25519'].includes(key.keyType) ? bytes.slice(0, -1) : bytes;
          const decrypted = AsymmetricEncryption.decryptWithCurveType(key.keyType, key.key, maybeUnpad);

          return decrypted;
        } catch (e) {
          // pass
        }
      }

      offset += cipher.dataLength;
    }

    throw new Error('decryption failed - Cipher.parseWithKeys');
  }
}
