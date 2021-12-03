// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AsymmetricEncryption } from '.';

export interface Sealer {
  unlock(key: Uint8Array): void
  decrypt(encryptedMessage: Uint8Array): Uint8Array
  encrypt(message: Uint8Array, recipient: Uint8Array): Uint8Array
  getAuthorKey(): Uint8Array
}

// the DefaultSealer uses Curve25519 provided by Tweetnacl for sealing
export class DefaultSealer implements Sealer {
  #key: Uint8Array;

  public unlock (key: Uint8Array) {
    if (key.length !== 32) {
      throw new Error('private key length error - Encryptor.constructor');
    }

    this.#key = key;
  }

  /**
    * decrypt a message with curve25519 from Tweetnacl
    * @param {Uint8Array} encryptedMessage encryptedMessage with leading nonce
    * @returns {Uint8Array} the original message
  */
  public decrypt (encryptedMessage: Uint8Array): Uint8Array {
    if (this.#key === undefined) {
      throw new Error('sealer is locked - Sealer.decrypt');
    }

    try {
      const result = AsymmetricEncryption.decrypt(
        this.#key, encryptedMessage
      );

      if (result) return result;
    } catch (err) {
      // console.log(err);
      // pass
    }

    return null;
  }

  /**
    * encrypt a message with curve25519 from Tweetnacl
    * @param {Uint8Array} message message to be encryted
    * @param {Uint8Array} recipient a curve25519 public key of the recipient
    * @returns {Uint8Array} encrypted message with leading nonce
  */
  public encrypt (message: Uint8Array, recipient: Uint8Array): Uint8Array {
    if (this.#key === undefined) {
      throw new Error('sealer is locked - Sealer.encrypt');
    }

    return AsymmetricEncryption.encrypt(
      this.#key, message, recipient
    );
  }

  /**
    * get the public key from the sealer secretKey
    * @returns {Uint8Array} publicKey of the sealer secretKey
  */
  public getAuthorKey (): Uint8Array {
    if (this.#key === undefined) {
      throw new Error('sealer is locked - Sealer.getAuthorKey');
    }

    return AsymmetricEncryption.getPublicKey(this.#key);
  }
}
