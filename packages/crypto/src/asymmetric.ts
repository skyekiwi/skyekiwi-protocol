// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { box, randomBytes } from 'tweetnacl';

export class AsymmetricEncryption {
  public static getPublicKey (secretKey: Uint8Array): Uint8Array {
    return box.keyPair.fromSecretKey(secretKey).publicKey;
  }

  public static encrypt (
    key: Uint8Array,
    message: Uint8Array,
    receiverPublicKey: Uint8Array
  ): Uint8Array {
    const nonce = randomBytes(box.nonceLength);
    const encrypted = box(message, nonce, receiverPublicKey, key);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);

    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return fullMessage;
  }

  public static decrypt (
    privateKey: Uint8Array,
    messageWithNonce: Uint8Array,
    senderPublicKey: Uint8Array
  ): Uint8Array {
    const nonce = messageWithNonce.slice(0, box.nonceLength);
    const message = messageWithNonce.slice(
      box.nonceLength, messageWithNonce.length
    );

    const decrypted = box.open(message, nonce, senderPublicKey, privateKey);

    if (!decrypted) {
      throw new Error('decryption failed - Box.decrypt');
    }

    return decrypted;
  }
}
