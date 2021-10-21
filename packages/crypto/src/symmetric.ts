// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes, secretbox } from 'tweetnacl';

export class SymmetricEncryption {
  /**
    * encrypt a message with xsalsa20-poly1305 from Tweetnacl
    * @param {Uint8Array} key a 32 bytes sealingKey
    * @param {Uint8Array} message message to be encrypt
    * @returns {Uint8Array} full encrypted message: nonce + encrypted message
  */
  public static encrypt (key: Uint8Array, message: Uint8Array): Uint8Array {
    const nonce = randomBytes(secretbox.nonceLength);
    const box = secretbox(message, nonce, key);

    const fullMessage = new Uint8Array(nonce.length + box.length);

    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);

    return fullMessage;
  }

  /**
    * decrypt a message with xsalsa20-poly1305 from Tweetnacl
    * @param {Uint8Array} key a 32 bytes sealingKey
    * @param {Uint8Array} messageWithNonce full encrypted message with leading nonce
    * @returns {Uint8Array} orignal message
  */
  public static decrypt (key: Uint8Array, messageWithNonce: Uint8Array): Uint8Array {
    const nonce = messageWithNonce.slice(0, secretbox.nonceLength);
    const message = messageWithNonce.slice(
      secretbox.nonceLength,
      messageWithNonce.length
    );

    const decrypted = secretbox.open(message, nonce, key);

    if (!decrypted) {
      throw new Error('decryption failed - SecretBox.decrypt');
    }

    return decrypted;
  }
}
