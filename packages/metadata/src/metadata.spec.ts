// Copyright 2021 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import { DefaultSealer } from '@skyekiwi/crypto';

import { Metadata } from '.';

describe('@skyekiwi/metadata', function () {
  test('encode/decode pre-seal works', () => {
    const authorSk = randomBytes(32);
    const hash = randomBytes(32);
    const slk = randomBytes(32);
    const sealer = new DefaultSealer();

    sealer.unlock(authorSk);

    const preSeal = Metadata.encodePreSeal({
      chunkCID: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      hash: hash,
      sealingKey: slk,
      version: Uint8Array.from([0x0, 0x0, 0x1, 0x1])
    });

    const recovered = Metadata.decodePreSealData(preSeal);

    expect(recovered.chunkCID).toEqual('QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW');
    expect(recovered.hash).toEqual(hash);
    expect(recovered.sealingKey).toEqual(slk);
    expect(recovered.version).toEqual(Uint8Array.from([0x0, 0x0, 0x1, 0x1]));
  });
});

// 516d5a4d7051384b375470315577616538535869335a4a714a444553384a4742694d6d4e57563269526174776257f15b34022ef3fc9bcfee38d140b908cf90a9b598952f4086b4e9a91dfe4019dfb3a0a8770fafb04b099f168b156e3d2bad541c4fa5c76d33a993e1e7d4248cd100000101
