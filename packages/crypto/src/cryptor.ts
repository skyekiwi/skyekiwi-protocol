// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import { AsymmetricEncryption, SymmetricEncryption } from '.';

export interface ACryptor {
  decrypt(encryptedMessage: Uint8Array, author: Uint8Array): Uint8Array
  decryptWithKeys?(keys: Uint8Array[], encryptedMessage: Uint8Array, author: Uint8Array): Uint8Array
  encrypt(message: Uint8Array, recipient: Uint8Array): Uint8Array
  getAuthorKey(): Uint8Array
}

export interface SCryptor {
  getPublicSealingKey?(): Uint8Array
  getSealingKey?(): Uint8Array
  seal(message: Uint8Array): Uint8Array
  unseal(encryptedMessage: Uint8Array): Uint8Array
  unsealWithKeys?(keys: Uint8Array[], encryptedMessage: Uint8Array): Uint8Array
}

export class DefaultACryptor implements ACryptor {
  readonly #key?: Uint8Array;

  constructor (key?: Uint8Array) {
    if (!key) {
      key = randomBytes(32);
    }

    if (key.length !== 32) {
      throw new Error('private key length error - Encryptor.constructor');
    }

    this.#key = key;
  }

  public decrypt (encryptedMessage: Uint8Array, author: Uint8Array): Uint8Array {
    console.error('decrypt not implemented', encryptedMessage, author);
    throw new Error('not implemented!');
  }

  public decryptWithKeys (keys: Uint8Array[], encryptedMessage: Uint8Array, author: Uint8Array): Uint8Array {
    for (const key of keys) {
      try {
        const result = AsymmetricEncryption.decrypt(
          key, encryptedMessage, author
        );

        if (result) return result;
      } catch (err) {
        // pass
      }
    }

    return null;
  }

  public encrypt (message: Uint8Array, recipient: Uint8Array): Uint8Array {
    return AsymmetricEncryption.encrypt(
      this.#key, message, recipient
    );
  }

  public getAuthorKey (): Uint8Array {
    return AsymmetricEncryption.getPublicKey(this.#key);
  }
}

export class DefaultSCryptor implements SCryptor {
  readonly #sealingKey?: Uint8Array;

  constructor (sealingKey?: Uint8Array) {
    if (!sealingKey) {
      sealingKey = randomBytes(32);
    }

    if (sealingKey.length !== 32) {
      throw new Error('sealing key length error - Encryptor.constructor');
    }

    this.#sealingKey = sealingKey;
  }

  public getPublicSealingKey (): Uint8Array {
    return AsymmetricEncryption.getPublicKey(this.#sealingKey);
  }

  public getSealingKey (): Uint8Array {
    return this.#sealingKey;
  }

  public seal (message: Uint8Array): Uint8Array {
    return SymmetricEncryption.encrypt(this.#sealingKey, message);
  }

  public unseal (encryptedMessage: Uint8Array): Uint8Array {
    console.error('unseal not implemented', encryptedMessage);
    throw new Error('not implemented!');
  }

  public unsealWithKeys (keys: Uint8Array[], encryptedMessage: Uint8Array): Uint8Array {
    for (const key of keys) {
      try {
        const result = SymmetricEncryption.decrypt(key, encryptedMessage);

        if (result) return result;
      } catch (e) {
        // pass
      }
    }

    return null;
  }
}
