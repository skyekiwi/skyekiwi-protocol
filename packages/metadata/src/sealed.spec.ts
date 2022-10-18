// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { CombinedCipher } from '@skyekiwi/crypto/types';

import { Sealed } from './sealed';

describe('@skyekiwi/metadata/sealed', function () {
  test('serde sealed', () => {
    const cipher: CombinedCipher = {
      bytes: new Uint8Array(187 * 10),
      dataLength: 187
    };
    const sealed = new Sealed({ cipher, isPublic: false });

    const se = sealed.serialize();
    const de = Sealed.deserialize(se);

    expect(de.cipher).toEqual(cipher);
    expect(de.isPublic).toEqual(false);
  });
});
