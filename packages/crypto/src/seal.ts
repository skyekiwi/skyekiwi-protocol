// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Sealed } from '@skyekiwi/metadata/types';
import type { EncryptionSchema } from './encryptionSchema';

import { getLogger, u8aToHex } from '@skyekiwi/util';

import { Sealer } from '.';

export class Seal {
  /**
    * get the len of a single encryption by the schema used by SkyeKiwi Protocol
    * @param {number} rawMessageSize size of the raw message
    * @returns {number} size of the encrypted message
  */
  public static getEncryptedMessageSize (rawMessageSize: number): number {
    // original size + nonce len + xsalsa20poly1305 overhead + 32bytes public key
    return rawMessageSize + 32 + 24 + 16;
  }

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
    const logger = getLogger('Seal.seal');

    if (encryptionSchema.isPublic) {
      logger.info('encryptionSchema marks the sealing as public, skipping ...');

      return {
        cipher: message,
        isPublic: true,
        membersCount: 0
      };
    }

    const encryptedMessageSize = Seal.getEncryptedMessageSize(message.length);

    const encryptedMessages = [];

    // 4. encrypt the private shares with the receivers' publicKeys
    for (const member of encryptionSchema.members) {
      logger.info(`sealing for ${u8aToHex(member)}`);
      const encryptedMessage = sealer.encrypt(message, member);

      encryptedMessages.push(encryptedMessage);
    }

    const membersCount = encryptionSchema.members.length;

    // result len: encrypted message len * members
    const result = new Uint8Array(membersCount * encryptedMessageSize);
    let offset = 0;

    for (const encryptedMesage of encryptedMessages) {
      result.set(encryptedMesage, offset);

      if (encryptedMesage.length !== encryptedMessageSize) {
        logger.error('encrypted message length unexpected!');
        throw new Error('encrypted message length unexpected - crypto/seal/seal');
      }

      offset += encryptedMessageSize;
    }

    return {
      cipher: result,
      isPublic: false,
      membersCount: membersCount
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
    keys?: Uint8Array[],
    sealer?: Sealer
  ): Uint8Array {
    const logger = getLogger('Seal.recover');

    if (sealed.isPublic) {
      logger.info('the sealed data is public, skipping ...');

      return sealed.cipher;
    }

    if (!keys || !sealer) {
      logger.error('sealed data is private but no keys/sealer is provided');
      throw new Error('sealed data is private but no keys/sealer is provided');
    }

    let offset = 0;
    const encryptedMessageLength = sealed.cipher.length / sealed.membersCount;

    logger.info(`parsing a message with size ${sealed.cipher.length} & ${sealed.membersCount} member`);

    const encryptedMessages = [];

    while (offset < sealed.cipher.length) {
      encryptedMessages.push(sealed.cipher.slice(offset, offset + encryptedMessageLength));
      offset += encryptedMessageLength;
    }

    for (const key of keys) {
      sealer.unlock(key);

      for (const encryptedMessage of encryptedMessages) {
        const message = sealer.decrypt(encryptedMessage);

        if (message) {
          logger.info('message recover success!');

          return message;
        }
      }
    }

    // if we got here - that means the keys are not included in the original encryption schema
    throw new Error('decryption failed, incorrect keys');
  }
}
