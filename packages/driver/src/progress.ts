// Copyright 2021-2022 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable sort-keys */
export const progressText: {
  [key: string]: (arg0?: number) => string
} = {
  GENERATE_PRESEALED_DATA_INIT: () => 'Initiating Upstreaming Processing Pipeline',
  UPSTREAM_PROCESSING_CHUNK: (chunkId: number) => `Processing Chunk ${chunkId}`,
  UPSTREAM_COMPUTING_HASH_SUCCESS: (chunkId: number) => `Computing Hash Success For ${chunkId}`,
  UPSTREAM_DEFLATE_CHUNK_SUCCESS: (chunkId: number) => `Deflate Chunk Success For ${chunkId}`,
  UPSTREAM_ENCRYPT_CHUNK_SUCCESS: (chunkId: number) => `Encrypt Chunk Success For ${chunkId}`,
  UPSTREAM_UPLOADING_IPFS: (chunkId: number) => `Uploading To IPFS For ${chunkId}`,
  UPSTREAM_UPLOADING_IPFS_SUCCESS: (chunkId: number) => `Uploaded To IPFS For ${chunkId}`,
  GENERATE_PRESEALED_DATA_UPSTREAM_SUCCESS: () => 'Successfully Upstreamed All Chunks',
  GENERATE_PRESEALED_DATA_UPLOAD_CID_LIST_SUCCESS: () => 'Successfully Encrypt & Upload CID LIST',
  GENERATE_SEALED_DATA_SEALING_SUCCESS: () => 'Successfully Seal the PreSealed Data',
  RECOVER_FROM_SEALED_DATA_UNSEALING_SUCCESS: () => 'Successfully Unseal the Sealed Data',
  RECOVER_FILE_FROM_PRESEALED_DATA_INIT: () => 'Initiating Downstreaming Processing Pipeline',
  RECOVER_FILE_FROM_PRESEALED_DATA_CHUNK_LIST_SUCCESS: () => 'Downloading & Decrypting Chunk List Success',
  RECOVER_FILE_FROM_PRESEALED_DATA_DOWNLOAD_CHUNK: (chunkId: number) => `Downloading & Decrypting Chunk ${chunkId}`,
  RECOVER_FILE_FROM_PRESEALED_DATA_DOWNLOAD_CHUNK_SUCCESS: (chunkId: number) => `Downloading & Decrypting Chunk Success ${chunkId}`,
  RECOVER_FILE_FROM_PRESEALED_DATA_WRITE_CHUNK_DATA: (chunkId: number) => `Returning Chunk Data for ${chunkId}`
};
