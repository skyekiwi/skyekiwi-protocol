// Copyright 2021 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Sealed } from '@skyekiwi/crypto/types';

export type ChunkList = {
  [chunkId: number]: {
    'ipfsCID': string,
    'ipfsChunkSize': number,
    'rawChunkSize': number,
  }
}

export type PreSealData = {
  author: Uint8Array,
  hash: Uint8Array,
  chunkCID: string,
  chunks: string[],
  sealingKey: Uint8Array,
  version: Uint8Array,
}

export type SealedData = {
  author: Uint8Array,
  publicSealingKey: Uint8Array,
  sealed: Sealed,
  version: Uint8Array,
}
