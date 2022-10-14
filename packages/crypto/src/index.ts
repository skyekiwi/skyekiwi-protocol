// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { utils as secpUtils } from '@noble/secp256k1';
import { cryptoWaitReady, sha256AsU8a } from '@polkadot/util-crypto';

import { AsymmetricEncryption } from './asymmetric';
import { Cipher } from './cipher';
import { SymmetricEncryption } from './symmetric';

export const sha256Hash = (bytes: Uint8Array): Uint8Array => {
  return sha256AsU8a(bytes);
};

// We use valid Secp256k1 key for random key for better compatibility
export const secureGenerateRandomKey = (): Uint8Array => {
  return secpUtils.randomPrivateKey();
};

export const initWASMInterface = async (): Promise<void> => {
  await cryptoWaitReady();
};

export { AsymmetricEncryption, SymmetricEncryption, Cipher };
