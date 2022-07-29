// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import tweetnacl from 'tweetnacl';

const { box, randomBytes } = tweetnacl;

export class AsymmetricEncryption {
  /**
    * get a curve25519 publicKey from a secretKey
    * @param {Uint8Array} secretKey a 32 bytes secretKey on curve25519
    * @returns {Uint8Array} a 32 bytes publicKey on curve25519
  */
  public static getPublicKey (secretKey: Uint8Array): Uint8Array {
    return box.keyPair.fromSecretKey(secretKey).publicKey;
  }

  /**
    * encrypt a message on curve25519
    * @param {Uint8Array} key a 32 bytes secretKey on curve25519
    * @param {Uint8Array} message message to be encrypt
    * @param {Uint8Array} receiverPublicKey a 32 bytes publicKey on curve25519 of the receiver
    * @returns {Uint8Array} full encrypted message: nonce + encrypted message
  */
  public static encrypt (
    message: Uint8Array,
    receiverPublicKey: Uint8Array
  ): Uint8Array {
    const ephmeralKey = randomBytes(32);
    const authorKey = AsymmetricEncryption.getPublicKey(ephmeralKey);

    const nonce = randomBytes(box.nonceLength);
    const encrypted = box(message, nonce, receiverPublicKey, ephmeralKey);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length + authorKey.length);

    fullMessage.set(authorKey);
    fullMessage.set(nonce, authorKey.length);
    fullMessage.set(encrypted, nonce.length + authorKey.length);

    return fullMessage;
  }

  /**
    * decrypt a message on curve25519
    * @param {Uint8Array} privateKey a 32 bytes secretKey on curve25519
    * @param {Uint8Array} messageWithNonce full encrypted message with nonce at the first 24 bytes
    * @param {Uint8Array} senderPublicKey a 32 bytes publicKey on curve25519 of the sender
    * @returns {Uint8Array} decrypted message
  */
  public static decrypt (
    privateKey: Uint8Array,
    messageWithNonce: Uint8Array
  ): Uint8Array {
    const authorKey = messageWithNonce.slice(0, box.publicKeyLength);
    const nonce = messageWithNonce.slice(box.publicKeyLength, box.publicKeyLength + box.nonceLength);
    const message = messageWithNonce.slice(
      box.publicKeyLength + box.nonceLength //, messageWithNonce.length
    );

    const decrypted = box.open(message, nonce, authorKey, privateKey);

    if (!decrypted) {
      throw new Error('decryption failed - Box.decrypt');
    }

    return decrypted;
  }
}
