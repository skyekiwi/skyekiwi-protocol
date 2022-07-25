// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface Sealer {
  unlock(key: Uint8Array): void
  decrypt(encryptedMessage: Uint8Array): Uint8Array
  encrypt(message: Uint8Array, recipient: Uint8Array): Uint8Array
  getAuthorKey(): Uint8Array
}

export interface Sign {
  getPublicKey(key: Uint8Array): Uint8Array
  generateSignature(key: Uint8Array, message: Uint8Array): Promise<Signature>,
  verifySignature(signature: Signature): boolean
}
