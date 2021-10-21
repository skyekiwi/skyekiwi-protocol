// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Sealed } from '@skyekiwi/metadata/types';
import type { EncryptionSchema } from './encryptionSchema';

import { hexToU8a, trimEnding, u8aToHex } from '@skyekiwi/util';

import { Sealer, TSS } from '.';

export class Seal {
  /**
    * seal a message with a pre-defined encryptionSchema and Sealer
    * @param {Uint8Array} message message to be encryoted
    * @param {EncryptionSchema} encryptionSchema the blueprint of the encryption
    * @param {Sealer} sealer a collection of sealer functions used
    * @returns {Sealed} sealed message
  */
  public static seal (
    message: Uint8Array,
    encryptionSchema: EncryptionSchema,
    sealer: Sealer
  ): Sealed {
    // 1. verify the encryptionSchema
    if (!encryptionSchema.verify()) {
      throw new Error('encryptionSchema Failer - Seal.seal');
    }

    let publicSharesHex = '';
    let privateSharesHex = '';

    // 2. generate all TSS shares before encryption
    const shares = TSS.generateShares(
      message,
      encryptionSchema.numOfShares,
      encryptionSchema.threshold
    );

    // 3. collect all unencrypted shares
    for (let i = 0; i < encryptionSchema.unencryptedPieceCount; i++) {
      publicSharesHex += u8aToHex(shares.pop()) + '|';
    }

    // _3. trim the ending '|'
    publicSharesHex = trimEnding(publicSharesHex);

    // 4. encrypt the private shares with the receivers' publicKeys
    for (const member of encryptionSchema.members) {
      privateSharesHex += u8aToHex(
        sealer.encrypt(shares.pop(), member)
      ) + '|';
    }

    // _4. trim the ending '|'
    privateSharesHex = trimEnding(privateSharesHex);

    return {
      private: privateSharesHex,
      public: publicSharesHex
    };
  }

  /**
    * recover a message from a Sealed message
    * @param {Sealed} sealed a sealed message
    * @param {Uint8Array[]} keys keys of all avaliable receivers' secretKeys; for MOST cases, there will be only one key
    * @param {Uint8Array} orignalAuthor the publicKey of the original author
    * @param {Sealer} sealer a collection of sealer functions used
    * @returns {Uint8Array} the original message
  */
  public static recover (
    sealed: Sealed,
    keys: Uint8Array[],
    orignalAuthor: Uint8Array,
    sealer: Sealer
  ): Uint8Array {
    const pub = sealed.public.split('|').map(hexToU8a);
    const priv = sealed.private.split('|').map(hexToU8a);

    // 1. collect all public shares
    const shares: Uint8Array[] = [...pub];

    // 2. try to decrypt as many private shares as possible
    for (const share of priv) {
      for (const key of keys) {
        sealer.key = key;
        const decrypted = sealer.decrypt(share, orignalAuthor);

        if (decrypted) { shares.push(decrypted); }
      }
    }

    // 3. try to recover the orignal message with avaliable shares
    //    might fail when the threshold is not met
    return TSS.recover(shares);
  }
}
