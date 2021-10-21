// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import secrets from '@skyekiwi/secrets';
import { hexToU8a, u8aToHex } from '@skyekiwi/util';

// 32 bytes
// SKYEKIWI_SECRETS_ENDING is used to make sure the integrity of the recovered message
const SKYEKIWI_SECRETS_ENDING =
  '1122334455667788990011223344556677889900112233445566778899002619';

// TODO: secret.js needs to be replaced by a better impl
// the padding issue is stupid
// secret.js gives a hex string that has
// half byte BITS + 1 bytes ID + N bytes of value
// the half byte cannot be parse to U8A correctly

class TSS {

  /**
    * generate TSS shares
    * @param {Uint8Array} message message to be shared
    * @param {number} numShares number of total shares to be generated
    * @param {number} threshold define the recovery threshold 
    * @returns {Uint8Array[]} all generated shares, same length as numShares
  */
  public static generateShares (
    message: Uint8Array,
    numShares: number,
    threshold: number
  ): Uint8Array[] {
    const messageHexString = u8aToHex(message);
    const wrappedMessageHexString = messageHexString + SKYEKIWI_SECRETS_ENDING;

    // Proceed with TSS
    const shares = secrets.share(wrappedMessageHexString, numShares, threshold);

    // get rid of the BITS field, where they create wrong u8a
    // it should be set by default to 8.
    // I cannot think of a chance if the below error can be thrown,
    // given the secret.js params is not changes
    const derivedSharing = shares.map((share) => {
      if (share[0] !== '8') {
        throw new Error('finite field broken somehow - TSS.generateShares');
      }

      return share.slice(1);
    });

    const _shares = derivedSharing.map(hexToU8a);

    return _shares;
  }

  /**
    * recover TSS shares
    * @param {Uint8Array[]} shares all shares collected; might not satisfied the threshold
    * @returns {Uint8Array} the orignal message
  */
  public static recover (shares: Uint8Array[]): Uint8Array {
    const sharesInHexString: string[] = shares.map(u8aToHex);

    // Recover by TSS
    // similar to shares generation, reverse the process by putting back the BITS
    const wrappedResult = secrets.combine(sharesInHexString.map((share) => '8' + share));

    if (wrappedResult.slice(wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length) !==
      SKYEKIWI_SECRETS_ENDING) {
      throw new Error('decryption failed, most likely because threshold is not met - TSS.recover');
    }

    return hexToU8a(
      wrappedResult.slice(0,
        wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length
      )
    );
  }
}

export { TSS, SKYEKIWI_SECRETS_ENDING };
