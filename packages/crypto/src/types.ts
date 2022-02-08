// Copyright 2021 - 2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type Signature = {
  'ethereum': string | null,

  'message': Uint8Array,

  'publicAddress': string,
  'publicKey': string,

  // 'ed25519': Uint8Array | null,
  // 'sr25519': Uint8Array | null,
}
