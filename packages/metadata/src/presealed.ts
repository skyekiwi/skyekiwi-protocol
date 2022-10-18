// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { stringToU8a, u8aToString } from '@skyekiwi/util';

import { SKYEKIWI_VERSION } from '.';

export class PreSealed {
  public chunkCID: string;
  public hash: Uint8Array;
  public sealingKey: Uint8Array;
  public version: Uint8Array;

  constructor (config: {
    chunkCID: string,
    hash: Uint8Array,
    sealingKey: Uint8Array,
    version?: Uint8Array,
  }) {
    this.chunkCID = config.chunkCID;
    this.hash = config.hash;
    this.sealingKey = config.sealingKey;
    this.version = config.version ? config.version : SKYEKIWI_VERSION;
  }

  public static serializedLength (): number {
    return 46 + // chunkCid
      +32 + // hash
      32 + // sealingKey
      4; // version
  }

  /**
    * encode an raw PreSealData
    * @returns {Uint8Array} the encoded PreSealData
  */
  public serialize (): Uint8Array {
    const result = new Uint8Array(PreSealed.serializedLength());

    // verify all fields are valid
    if (
      !(stringToU8a(this.chunkCID).length === 46) ||
      !(this.hash.length === 32) ||
      !(this.sealingKey.length === 32) ||
      !(this.version.length === 4)
    ) {
      throw new Error('pre-sealing error - Metadata.getPreSealData');
    }

    result.set(stringToU8a(this.chunkCID), 0);
    result.set(this.hash, 46);
    result.set(this.sealingKey, 78);
    result.set(this.version, 110);

    return result;
  }

  /**
    * decode the preSealData
    * @returns {PreSealData} the decoded PreSealData
  */
  public static deserialize (bytes: Uint8Array): PreSealed {
    if (bytes.length !== PreSealed.serializedLength()) {
      throw new Error('wrong length of pre-sealed data - PreSealed - deserialized');
    }

    const chunkCID = u8aToString(bytes.slice(0, 46));
    const hash = bytes.slice(46, 78);
    const slk = bytes.slice(78, 110);
    const version = bytes.slice(110);

    return new PreSealed({
      chunkCID: chunkCID,
      hash: hash,
      sealingKey: slk,
      version: version
    });
  }
}
