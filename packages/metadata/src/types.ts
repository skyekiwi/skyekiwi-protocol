// Copyright 2021 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type Sealed = {
  'private': string,
  'public': string,
};

export type ChunkList = {
  [chunkId: number]: {
    'ipfsCID': string,
    'ipfsChunkSize': number,
    'rawChunkSize': number,
  }
}

export type PreSealData = {
  author: Uint8Array,
  chunkCID: string,
  hash: Uint8Array,
  sealingKey: Uint8Array,
  version: Uint8Array,
}

export type SealedMetadata = {
  author: Uint8Array,
  publicSealingKey: Uint8Array,
  sealed: Sealed,
  version: Uint8Array,
}
