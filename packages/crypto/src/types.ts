// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type KeypairType = 'ed25519' | 'sr25519' | 'ecdsa' | 'ethereum';

export type PublicKey = {
  key: Uint8Array,
  keyType: KeypairType,
}
export type SecretKey = {
  key: Uint8Array,
  keyType: KeypairType,
}

export type CombinedCipher = {
  bytes: Uint8Array,
  dataLength: number,
}
