// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType, PublicKey, SecretKey } from './types';

import { AsymmetricEncryption, initWASMInterface, secureGenerateRandomKey } from '@skyekiwi/crypto';

import { Sign } from './sign';

describe('@skyekiwi/crypto/sign', function () {
  ['sr25519', 'ed25519', 'ethereum'].map((type) => {
    test(`sign & validate singature ${type}`, async () => {
      await initWASMInterface();

      const msg = new Uint8Array(10);
      const keyType = type as KeypairType;

      const key = secureGenerateRandomKey();
      const sk: SecretKey = {
        key: key, keyType: keyType
      };
      const pk: PublicKey = {
        key: AsymmetricEncryption.getPublicKeyWithCurveType(keyType, key),
        keyType: keyType
      };

      const sig = Sign.sign(sk, msg);

      expect(Sign.verify(pk, msg, sig)).toBeTruthy();
    });

    return null;
  });

  test('sign & validate singature with Ethers.js', async () => {
    const msg = new Uint8Array(10);
    const keyType = 'ethereum';

    const key = secureGenerateRandomKey();
    const sk: SecretKey = {
      key: key, keyType: keyType
    };
    const pk: PublicKey = {
      key: AsymmetricEncryption.getPublicKeyWithCurveType(keyType, key),
      keyType: keyType
    };

    const sig = await Sign.signWithEthersJs(sk, msg);

    expect(Sign.verifyWithEthersJs(pk, msg, sig)).toBeTruthy();
  });
});

// const wallet = new ethers.Wallet(sk.key);
//       const s = await wallet.signMessage(new Uint8Array([0, 1, 2]));

//       console.log(u8aToHex(sig))
//       console.log(wallet.address, s, u8aToHex(new Uint8Array([0, 1, 2])))
//     //   console.log( ethers.utils.verifyMessage(msg, s) );
