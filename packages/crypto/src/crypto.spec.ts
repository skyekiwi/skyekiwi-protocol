// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from './types';

import { decodeAddress, Keyring } from '@polkadot/keyring';

import { stringToU8a, u8aToString } from '@skyekiwi/util';

import { AsymmetricEncryption, initWASMInterface, secureGenerateRandomKey, SymmetricEncryption } from '.';

describe('@skyekiwi/crypto', () => {
  const key: Uint8Array = secureGenerateRandomKey();

  const message = '123456780123456';
  const _message = stringToU8a(message);

  beforeAll(async () => {
    await initWASMInterface();
  });

  test('Symmetric: Encryption & Decryption Works', () => {
    const encrypted = SymmetricEncryption.encrypt(key, _message);
    const decrypted = SymmetricEncryption.decrypt(key, encrypted);
    const decryptedString = u8aToString(decrypted);

    expect(decryptedString).toEqual(message);
  });

  test('Asymmetric: Encryption & Decryption Works', () => {
    const receiverPrivateKey = secureGenerateRandomKey();
    const receiverPublicKey = AsymmetricEncryption.getPublicKey(receiverPrivateKey);
    const encrypted = AsymmetricEncryption.encrypt(_message, receiverPublicKey);

    const decrypted = AsymmetricEncryption.decrypt(receiverPrivateKey, encrypted);
    const decryptedString = u8aToString(decrypted);

    expect(decryptedString).toEqual(message);
  });

  test('Symmetric: Decryption Fails w/Wrong Key', () => {
    const wrongKey = secureGenerateRandomKey();
    const encrypted = SymmetricEncryption.encrypt(key, _message);

    expect(() => SymmetricEncryption.decrypt(wrongKey, encrypted)).toThrow(
      'decryption failed - SecretBox.decrypt'
    );
  });

  test('Asymmetric: Decryption Fails w/Wrong Key', () => {
    const receiverPrivateKey = secureGenerateRandomKey();
    const receiverPublicKey = AsymmetricEncryption.getPublicKey(receiverPrivateKey);
    const encrypted = AsymmetricEncryption.encrypt(_message, receiverPublicKey);

    // wrong receiver's private key
    const wrongPrivateKey = secureGenerateRandomKey();

    expect(() => AsymmetricEncryption.decrypt(wrongPrivateKey, encrypted)).toThrow(
      'decryption failed - Box.decrypt'
    );
  });

  ['sr25519', 'ed25519', 'ethereum'].map((type) => {
    const keyType = type as KeypairType;

    test(`Asymmetric: Encrypt/Decrypt with Curve Type ${keyType}`, () => {
      // 1. generate a keyPair
      const receiverPrivateKey = secureGenerateRandomKey();
      const receiverPublicKey = AsymmetricEncryption.getPublicKeyWithCurveType(keyType, receiverPrivateKey);
      const encrypted = AsymmetricEncryption.encryptWithCurveType(keyType, _message, receiverPublicKey);
      const decrypted = AsymmetricEncryption.decryptWithCurveType(keyType, receiverPrivateKey, encrypted);

      expect(decrypted).toEqual(_message);
    });

    if (type !== 'ethereum') {
      test(`Asymmetric: Share Between Polkadot Addresses of ${type}`, () => {
        const seed = secureGenerateRandomKey();

        const address = (new Keyring({ type: keyType })).addFromSeed(seed).address;
        const encrypted = AsymmetricEncryption.encryptWithCurveType(keyType, _message, decodeAddress(address));
        const msg = AsymmetricEncryption.decryptWithCurveType(keyType, seed, encrypted);

        expect(msg).toEqual(_message);
      });
    }

    return null;
  });
});
