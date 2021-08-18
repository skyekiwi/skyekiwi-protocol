// Copyright 2021 @skyekiwi/ipfs authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ipfs from 'ipfs-core';

export type IPFSResult = { cid: string, size: number };
export type IPFSNode = ipfs.IPFS;
