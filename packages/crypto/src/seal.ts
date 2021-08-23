// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { EncryptionSchema } from './encryptionSchema';
import type { Sealed } from './types';

import { hexToU8a, trimEnding, u8aToHex } from '@skyekiwi/util';

import { ACryptor, SCryptor, TSS } from '.';

export class Sealer {
  public aCryptor: ACryptor
  public sCryptor: SCryptor
}

export class Seal {
  public static seal (
    message: Uint8Array,
    encryptionSchema: EncryptionSchema,
    aCryptor: ACryptor
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
        aCryptor.encrypt(shares.pop(), member)
      ) + '|';
    }

    privateSharesHex = trimEnding(publicSharesHex);

    return {
      private: privateSharesHex,
      public: publicSharesHex
    };
  }

  public static recover (
    sealed: Sealed,
    keys: Uint8Array[],
    orignalAuthor: Uint8Array,
    aCryptor: ACryptor
  ): Uint8Array {
    const pub = sealed.public.split('|').map(hexToU8a);
    const priv = sealed.private.split('|').map(hexToU8a);

    const shares: Uint8Array[] = [...pub];

    for (const share of priv) {
      try {
        const decrypted = aCryptor.decryptWithKeys(
          keys, share, orignalAuthor
        );

        if (decrypted) { shares.push(decrypted); }
      } catch (err) {
        // pass
      }
    }

    return TSS.recover(shares);
  }
}
