// Copyright 2021 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import { DefaultSealer } from '@skyekiwi/crypto';
import { u8aToHex } from '@skyekiwi/util';

import { Metadata } from '.';

const print = console.log;

describe('@skyekiwi/metadata', function () {
  test('encode/decode pre-seal works', () => {
    const authorSk = randomBytes(32);

    print('author privvate key', u8aToHex(authorSk));

    const hash = randomBytes(32);

    print('hash', u8aToHex(hash));

    const slk = randomBytes(32);

    print('slk', u8aToHex(slk));

    const sealer = new DefaultSealer();

    sealer.key = authorSk;

    const preSeal = Metadata.encodePreSeal({
      author: sealer.getAuthorKey(),
      chunkCID: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      hash: hash,
      sealingKey: slk,
      version: Uint8Array.from([0x0, 0x0, 0x0, 0x1])
    });

    console.log('preseal', u8aToHex(preSeal));
    console.log('preseal', preSeal);

    const recovered = Metadata.decodePreSealData(preSeal);

    expect(recovered.author).toEqual(sealer.getAuthorKey());
    expect(recovered.chunkCID).toEqual('QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW');
    expect(recovered.hash).toEqual(hash);
    expect(recovered.sealingKey).toEqual(slk);
    expect(recovered.version).toEqual(Uint8Array.from([0x0, 0x0, 0x0, 0x1]));

    console.log(recovered);
  });
});

// 8f73cf603eea07ace6b5cd1041e60ed1209b0cc3aebdfca1638a2fd643cc105d516d5a4d7051384b375470315577616538535869335a4a714a444553384a4742694d6d4e575632695261747762573724d3b93e2e5a44a53e2d981b91dc6cb12ebdd0dcdee6ff818517f8f08a5a70fba9a61e730235488bba7adfffddc6bcc348a98d9f2e56fe4247f3590c280a4b00000001
