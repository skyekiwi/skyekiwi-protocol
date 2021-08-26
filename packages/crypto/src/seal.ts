// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Sealed } from '@skyekiwi/metadata/types';
import type { EncryptionSchema } from './encryptionSchema';

import { hexToU8a, trimEnding, u8aToHex } from '@skyekiwi/util';

import { Sealer, TSS } from '.';

export class Seal {
  public static seal (
    message: Uint8Array,
    encryptionSchema: EncryptionSchema,
    sealer: Sealer
  ): Sealed {
    if (!encryptionSchema.verify()) {
      throw new Error('encryptionSchema Failer - Seal.seal');
    }

    let publicSharesHex = '';
    let privateSharesHex = '';

    const shares = TSS.generateShares(
      message,
      encryptionSchema.numOfShares,
      encryptionSchema.threshold
    );

    for (let i = 0; i < encryptionSchema.unencryptedPieceCount; i++) {
      publicSharesHex += u8aToHex(shares.pop()) + '|';
    }

    publicSharesHex = trimEnding(publicSharesHex);

    for (const member of encryptionSchema.members) {
      privateSharesHex += u8aToHex(
        sealer.encrypt(shares.pop(), member)
      ) + '|';
    }

    privateSharesHex = trimEnding(privateSharesHex);

    return {
      private: privateSharesHex,
      public: publicSharesHex
    };
  }

  public static recover (
    sealed: Sealed,
    keys: Uint8Array[],
    orignalAuthor: Uint8Array,
    sealer: Sealer
  ): Uint8Array {
    const pub = sealed.public.split('|').map(hexToU8a);
    const priv = sealed.private.split('|').map(hexToU8a);

    const shares: Uint8Array[] = [...pub];

    for (const share of priv) {
      for (const key of keys) {
        sealer.key = key;
        const decrypted = sealer.decrypt(share, orignalAuthor);

        if (decrypted) { shares.push(decrypted); }
      }
    }

    return TSS.recover(shares);
  }
}
