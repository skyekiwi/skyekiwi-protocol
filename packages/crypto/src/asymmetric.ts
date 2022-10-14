// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from './types';

import { getPublicKey, getSharedSecret, utils as secpUtils } from '@noble/secp256k1';
import { convertPublicKeyToCurve25519, convertSecretKeyToCurve25519, sr25519Agreement, sr25519PairFromSeed } from '@polkadot/util-crypto';
import tweetnacl from 'tweetnacl';

import { SymmetricEncryption } from './symmetric';
import { secureGenerateRandomKey, sha256Hash } from '.';

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
    const ephmeralKey = secureGenerateRandomKey();
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

  /**
    * encrypt a message on other ECC
    * WARNING: WE DO NOT CHECK FOR PUBLIC KEY TYPE, NOR CAN WE. MAKE SURE PUBLIC KEY IS ON THE SAME CURVE AS KEYTYPE
    * @param {string} keyType type of the curve 'sr25519' or 'ed25519'
    * @param {Uint8Array} message message to be encrypted
    * @param {Uint8Array} publicKey a 32 bytes publicKey of the receipient on the same curve as @keyType
    * @returns {Uint8Array} encrypted message
  */
  public static encryptWithCurveType (
    keyType: KeypairType,
    message: Uint8Array,
    publicKey: Uint8Array
  ): Uint8Array {
    if (keyType === 'sr25519') {
      if (publicKey.length !== 32) {
        throw new Error(`wrong publicKey size. Expect 32 but got ${publicKey.length}.`);
      }

      const ephmeralKey = secureGenerateRandomKey();
      const pair = sr25519PairFromSeed(ephmeralKey);
      const ecdhKey = sr25519Agreement(pair.secretKey, publicKey);
      const noncePlusEncrypted = SymmetricEncryption.encrypt(ecdhKey, message);

      const res = new Uint8Array(32 + // ephmeral public key
        noncePlusEncrypted.length
      );

      res.set(pair.publicKey, 0);
      res.set(noncePlusEncrypted, 32);

      return res;
    } else if (keyType === 'ed25519') {
      if (publicKey.length !== 32) {
        throw new Error(`wrong publicKey size. Expect 32 but got ${publicKey.length}.`);
      }

      // For ed25519 - we convert all keys on curve25519, and process ecdh with curve25519
      const theirPublicKey = convertPublicKeyToCurve25519(publicKey);

      return AsymmetricEncryption.encrypt(message, theirPublicKey);
    } else if (keyType === 'ecdsa' || keyType === 'ethereum') {
      if (publicKey.length !== 33) {
        throw new Error(`wrong publicKey size. Expect 33 but got ${publicKey.length}.`);
      }

      const ephmeralKey = secureGenerateRandomKey();

      secpUtils.precompute();
      const pk = getPublicKey(ephmeralKey, true);
      const ecdhKey = sha256Hash(getSharedSecret(ephmeralKey, publicKey, true));
      const noncePlusEncrypted = SymmetricEncryption.encrypt(ecdhKey, message);

      const res = new Uint8Array(33 + // ephmeral public key
        noncePlusEncrypted.length
      );

      res.set(pk, 0);
      res.set(noncePlusEncrypted, 33);

      return res;
    } else {
      throw new Error('unsupported curve type - AsymmetricEncryption.encryptWithCurveType');
    }
  }

  /**
    * decrypt a message on other ECC
    * WARNING: WE DO NOT CHECK FOR PRIVATE KEY TYPE, NOR CAN WE. MAKE SURE PRIVATE KEY IS ON THE SAME CURVE AS KEYTYPE
    * @param {string} keyType type of the curve 'sr25519' or 'ed25519'
    * @param {Uint8Array} secretKey a 32 bytes secretKey of the receipient on the same curve as @keyType
    * @param {Uint8Array} message message to be decrypted
    * @returns {Uint8Array} decrypted message
  */
  public static decryptWithCurveType (
    keyType: KeypairType,
    secretKey: Uint8Array,
    message: Uint8Array
  ): Uint8Array {
    if (secretKey.length !== 32) {
      throw new Error(`wrong secretKey size. Expect 32 but got ${secretKey.length}.`);
    }

    if (keyType === 'sr25519') {
      const theirPublicKey = message.slice(0, 32);

      const pair = sr25519PairFromSeed(secretKey);
      const ecdhKey = sr25519Agreement(pair.secretKey, theirPublicKey);

      return SymmetricEncryption.decrypt(ecdhKey, message.slice(32));
    } else if (keyType === 'ed25519') {
      // For ed25519 - we convert all keys on curve25519, and process ecdh with curve25519
      const ourSecretKey = convertSecretKeyToCurve25519(secretKey);

      return AsymmetricEncryption.decrypt(ourSecretKey, message);
    } else if (keyType === 'ecdsa' || keyType === 'ethereum') {
      const theirPublicKey = message.slice(0, 33);
      const ecdhKey = sha256Hash(getSharedSecret(secretKey, theirPublicKey, true));

      return SymmetricEncryption.decrypt(ecdhKey, message.slice(33));
    } else {
      throw new Error('unsupported curve type - AsymmetricEncryption.decryptWithCurveType');
    }
  }

  /**
    * get public key on a curve type
    * @param {string} keyType type of the curve 'sr25519' or 'ed25519'
    * @param {Uint8Array} secretKey a 32 bytes secretKey of the receipient on the same curve as @keyType
    * @returns {Uint8Array} public key
  */
  public static getPublicKeyWithCurveType (
    keyType: KeypairType,
    secretKey: Uint8Array
  ): Uint8Array {
    if (secretKey.length !== 32) {
      throw new Error(`wrong secretKey size. Expect 32 but got ${secretKey.length}.`);
    }

    if (keyType === 'sr25519') {
      return sr25519PairFromSeed(secretKey).publicKey;
    } else if (keyType === 'ed25519') {
      return tweetnacl.sign.keyPair.fromSeed(secretKey).publicKey;
    } else if (keyType === 'ecdsa' || keyType === 'ethereum') {
      return getPublicKey(secretKey, true);
    } else {
      throw new Error('unsupported curve type - AsymmetricEncryption.getPublicKeyWithCurveType');
    }
  }
}
