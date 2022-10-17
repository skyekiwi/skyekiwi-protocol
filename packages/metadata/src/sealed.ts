// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { CombinedCipher } from '@skyekiwi/crypto/types';

import { PreSealed, SKYEKIWI_VERSION } from '.';

export class Sealed {
  cipher: CombinedCipher;
  isPublic: boolean;
  version: Uint8Array;

  constructor (config: {
    cipher: CombinedCipher,
    isPublic: boolean,
    version?: Uint8Array,
  }) {
    this.cipher = config.cipher;
    this.isPublic = config.isPublic;
    this.version = config.version ? config.version : SKYEKIWI_VERSION;
  }

  /**
    * encode an raw Sealed
    * @returns {Uint8Array} the encoded Sealed
  */
  public serialize (): Uint8Array {
    if (this.isPublic && this.cipher.dataLength !== 0) {
      throw new Error('cipher dataLength should be 0 when isPublic - Sealed.serialize');
    }

    const result = new Uint8Array(2 + 4 + this.cipher.bytes.length);

    if (this.isPublic) {
      result.set([0x1, 0x1], 0);
    } else {
      result.set([0x0, 0x0], 0);
    }

    result.set(this.cipher.bytes, 2);
    result.set(this.version, 2 + this.cipher.bytes.length);

    return result;
  }

  /**
    * decode the Sealed
    * @returns {Sealed} the decoded Sealed
  */
  public static deserialize (bytes: Uint8Array): Sealed {
    const isPublic = bytes[0] === 0x1;
    const dataLength = PreSealed.serializedLength() +
      33 + // padded public key
      16 + 24; // overhead + nonce

    return new Sealed({
      cipher: {
        bytes: bytes.slice(2, bytes.length - 4),
        dataLength: isPublic ? 0 : dataLength
      },
      isPublic: isPublic,
      version: bytes.slice(bytes.length - 4, bytes.length)
    });
  }

  /**
    * combine two sealed data
    * @param {Sealed} a the first sealed data
    * @param {Sealed} b the second seale data
    * @returns {Sealed} the resulting Sealed
  */
  public static combineSealedData (a: Sealed, b: Sealed): Sealed {
    if (a.isPublic !== b.isPublic || a.version !== b.version) {
      throw new Error('publicity or version of two Sealed data is not the same - Sealed.combineSealedData');
    }

    const bytes = new Uint8Array(a.cipher.bytes.length + b.cipher.bytes.length);

    bytes.set(a.cipher.bytes, 0);
    bytes.set(b.cipher.bytes, a.cipher.bytes.length);

    return new Sealed({
      cipher: { bytes, dataLength: a.cipher.dataLength },
      isPublic: a.isPublic,
      version: a.version
    });
  }
}
