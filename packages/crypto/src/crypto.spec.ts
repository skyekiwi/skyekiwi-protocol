// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import { stringToU8a, u8aToString } from '@skyekiwi/util';

import { AsymmetricEncryption, SymmetricEncryption } from '.';

describe('@skyekiwi/crypto', () => {
  const key: Uint8Array = randomBytes(32);

  const message = '123456780123456';
  const _message = stringToU8a(message);

  test('Symmetric: Encryption & Decryption Works', () => {
    const encrypted = SymmetricEncryption.encrypt(key, _message);
    const decrypted = SymmetricEncryption.decrypt(key, encrypted);
    const decryptedString = u8aToString(decrypted);

    expect(decryptedString).toEqual(message);
  });

  test('Asymmetric: Encryption & Decryption Works', () => {
    const receiverPrivateKey = randomBytes(32);
    const receiverPublicKey = AsymmetricEncryption.getPublicKey(receiverPrivateKey);
    const encrypted = AsymmetricEncryption.encrypt(_message, receiverPublicKey);

    const decrypted = AsymmetricEncryption.decrypt(receiverPrivateKey, encrypted);
    const decryptedString = u8aToString(decrypted);

    expect(decryptedString).toEqual(message);
  });

  test('Symmetric: Decryption Fails w/Wrong Key', () => {
    const wrongKey = randomBytes(32);
    const encrypted = SymmetricEncryption.encrypt(key, _message);

    expect(() => SymmetricEncryption.decrypt(wrongKey, encrypted)).toThrow(
      'decryption failed - SecretBox.decrypt'
    );
  });

  test('Asymmetric: Decryption Fails w/Wrong Key', () => {
    const receiverPrivateKey = randomBytes(32);
    const receiverPublicKey = AsymmetricEncryption.getPublicKey(receiverPrivateKey);
    const encrypted = AsymmetricEncryption.encrypt(_message, receiverPublicKey);

    // wrong receiver's private key
    const wrongPrivateKey = randomBytes(32);

    expect(() => AsymmetricEncryption.decrypt(wrongPrivateKey, encrypted)).toThrow(
      'decryption failed - Box.decrypt'
    );
  });
});
