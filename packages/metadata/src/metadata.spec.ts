// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AsymmetricEncryption, DefaultSealer, EncryptionSchema, Seal } from '@skyekiwi/crypto';
import { hexToU8a, u8aToHex } from '@skyekiwi/util';

import { Metadata } from '.';

let preSeal: Uint8Array;
const authorSk = hexToU8a('1234567890123456789012345678904512345678901234567890123456789045');
const sealer = new DefaultSealer();

sealer.unlock(authorSk);

describe('@skyekiwi/metadata', function () {
  test('encode/decode pre-seal metadata works', () => {
    const hash = new Uint8Array(32);
    const slk = hexToU8a('1234567890123456789012345678901212345678901234567890123456789045');

    preSeal = Metadata.encodePreSeal({
      chunkCID: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      hash: hash,
      sealingKey: slk,
      version: Uint8Array.from([0x0, 0x0, 0x1, 0x1])
    });

    const recovered = Metadata.decodePreSealData(preSeal);

    expect(u8aToHex(preSeal)).toEqual('516d5a4d7051384b375470315577616538535869335a4a714a444553384a4742694d6d4e575632695261747762570000000000000000000000000000000000000000000000000000000000000000123456789012345678901234567890121234567890123456789012345678904500000101');
    expect(recovered.chunkCID).toEqual('QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW');
    expect(recovered.hash).toEqual(hash);
    expect(recovered.sealingKey).toEqual(slk);
    expect(recovered.version).toEqual(Uint8Array.from([0x0, 0x0, 0x1, 0x1]));
  });

  test('encode/decode seal metadata works for one recipient', () => {
    const encryptionSchema = new EncryptionSchema(false);

    encryptionSchema.addMember(sealer.getAuthorKey());

    const sealed = Seal.seal(preSeal, encryptionSchema, sealer);

    expect(sealer.decrypt(sealed.cipher)).toEqual(preSeal);

    const sealedMetadata = Metadata.encodeSealedMetadta({
      sealed: sealed, version: new Uint8Array([0x0, 0x0, 0x1, 0x1])
    });

    const sealedRecovered = Metadata.decodeSealedData(sealedMetadata);

    expect(sealedRecovered.sealed).toEqual(sealed);
    expect(Seal.recover(sealedRecovered.sealed, [authorSk], sealer)).toEqual(preSeal);
  });

  test('encode/decode seal metadata works for multiple recipients', () => {
    const newKey = hexToU8a('1234567890123456789012345678908912345678901234567890123456789089');

    const encryptionSchema = new EncryptionSchema(false);

    encryptionSchema.addMember(sealer.getAuthorKey());
    encryptionSchema.addMember(AsymmetricEncryption.getPublicKey(newKey));

    const sealed = Seal.seal(preSeal, encryptionSchema, sealer);

    expect(sealer.decrypt(sealed.cipher.slice(0, 186))).toEqual(preSeal);

    sealer.unlock(newKey);
    expect(sealer.decrypt(sealed.cipher.slice(186))).toEqual(preSeal);

    sealer.unlock(authorSk);
    const sealedMetadata = Metadata.encodeSealedMetadta({
      sealed: sealed, version: new Uint8Array([0x0, 0x0, 0x1, 0x1])
    });

    const sealedRecovered = Metadata.decodeSealedData(sealedMetadata);

    expect(sealedRecovered.sealed).toEqual(sealed);
    expect(Seal.recover(sealedRecovered.sealed, [authorSk], sealer)).toEqual(preSeal);
  });

  test('encode/decode seal metadata works for public', () => {
    const encryptionSchema = new EncryptionSchema(true);

    encryptionSchema.addMember(sealer.getAuthorKey());

    const sealed = Seal.seal(preSeal, encryptionSchema, sealer);
    const sealedMetadata = Metadata.encodeSealedMetadta({
      sealed: sealed, version: new Uint8Array([0x0, 0x0, 0x1, 0x1])
    });

    const sealedRecovered = Metadata.decodeSealedData(sealedMetadata);

    expect(sealedRecovered.sealed).toEqual(sealed);
    expect(Seal.recover(sealedRecovered.sealed, [authorSk], sealer)).toEqual(preSeal);
  });
});
