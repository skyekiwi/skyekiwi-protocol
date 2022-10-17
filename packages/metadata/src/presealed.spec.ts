// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PreSealed } from './presealed';

describe('@skyekiwi/metadata/presealed', function () {
  test('serde presealed', () => {
    const preSealed = new PreSealed({
      chunkCID: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      hash: new Uint8Array(32),
      sealingKey: new Uint8Array(32)
    });

    const se = preSealed.serialize();
    const de = PreSealed.deserialize(se);

    expect(de.chunkCID).toEqual('QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW');
    expect(de.hash).toEqual(new Uint8Array(32));
    expect(de.sealingKey).toEqual(new Uint8Array(32));
  });
});
