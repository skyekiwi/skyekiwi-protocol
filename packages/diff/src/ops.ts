// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DiffOp } from './types';

import { stringToU8a, u8aToString } from '@skyekiwi/util';

const padSize = (size: number): Uint8Array => {
  const res = new Uint8Array(4);

  res[0] = size & 0xff;
  res[1] = (size >> 8) & 0xff;
  res[2] = (size >> 16) & 0xff;
  res[3] = (size >> 24) & 0xff;

  return res;
};

const unpadSize = (size: Uint8Array): number => {
  return size[0] | (size[1] << 8) | (size[2] << 16) | (size[3] << 24);
};

const buildDiffOps = (ops: DiffOp[]): Uint8Array => {
  let res: Uint8Array = new Uint8Array();

  for (const op of ops) {
    switch (op[0]) {
      case 0: res = new Uint8Array([...res, 0]); break;
      case 1: res = new Uint8Array([...res, 1]); break;
      case -1: res = new Uint8Array([...res, 2]); break;
    }

    const raw = stringToU8a(op[1]);

    res = new Uint8Array([...res, ...padSize(raw.length)]);
    res = new Uint8Array([...res, ...raw]);
  }

  return res;
};

const parseDiffOps = (ops: Uint8Array): DiffOp[] => {
  const res: DiffOp[] = [];
  let i = 0;

  while (i < ops.length) {
    switch (ops[i]) {
      case 0: res.push([0, '']); break;
      case 1: res.push([1, '']); break;
      case 2: res.push([-1, '']); break;
    }

    i++;
    const size = unpadSize(ops.slice(i, i + 4));

    i += 4;

    res[res.length - 1][1] = u8aToString(ops.slice(i, i + size));
    i += size;
  }

  return res;
};

export { buildDiffOps, parseDiffOps };
