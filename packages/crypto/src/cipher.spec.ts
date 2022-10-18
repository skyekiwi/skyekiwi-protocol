// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType, PublicKey, SecretKey } from './types';

import { AsymmetricEncryption, initWASMInterface, secureGenerateRandomKey } from '@skyekiwi/crypto';

import { Cipher } from './cipher';

describe('@skyekiwi/crypto/cipher', function () {
  ['sr25519', 'ed25519', 'ethereum'].map((type) => {
    test(`build and parse ${type}`, async () => {
      await initWASMInterface();

      const msg = new Uint8Array(114);
      const keyType = type as KeypairType;

      const key1 = secureGenerateRandomKey();
      const sk1: SecretKey = {
        key: key1, keyType: keyType
      };
      const pk1: PublicKey = {
        key: AsymmetricEncryption.getPublicKeyWithCurveType(keyType, key1),
        keyType: keyType
      };

      const key2 = secureGenerateRandomKey();
      const sk2: SecretKey = {
        key: key2, keyType: keyType
      };
      const pk2: PublicKey = {
        key: AsymmetricEncryption.getPublicKeyWithCurveType(keyType, key2),
        keyType: keyType
      };

      const cipher = Cipher.build(msg, [pk1, pk2]);

      const decrypted1 = Cipher.parseWithKeys(cipher, [sk1]);
      const decrypted2 = Cipher.parseWithKeys(cipher, [sk2]);

      expect(decrypted1).toEqual(msg);
      expect(decrypted2).toEqual(msg);
    });

    return null;
  });
});
