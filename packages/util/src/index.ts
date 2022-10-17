// Copyright 2021-2022 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { sendTx, txProgressText } from './sendTx';

export { txProgressText, sendTx };

export const hexToU8a = (hex: string): Uint8Array => {
  if (isValidHex(hex)) {
    return new Uint8Array(hex.match(/[0-9A-Fa-f]{1,2}/g).map((byte) => parseInt(byte, 16)));
  } else {
    throw new Error('invalid hex string: Util.hexToU8a');
  }
};

export const u8aToHex = (bytes: Uint8Array): string =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export const isValidHex = (str: string): boolean => {
  return (str.length & 1) === 0 &&
    (/^[0-9A-Fa-f]*$/g).test(str);
};

export const toBase64 = (x: string): string =>
  Buffer.from(x, 'binary').toString('base64');

export const fromBase64 = (x: string): string =>
  Buffer.from(x, 'base64').toString('binary');

export const stringToU8a = (str: string): Uint8Array => {
  return (new TextEncoder()).encode(str);
};

export const u8aToString = (u8a: Uint8Array): string => {
  return (new TextDecoder('utf-8')).decode(u8a);
};

export const indexToString = (index: number, hexStarting = true): string => {
  return (hexStarting ? '0x' : '') + index.toString(16).padStart(8, '0');
};

export const stringToIndex = (index: string): number => {
  if (index.indexOf('0x') === -1) {
    index = '0x' + index;
  }

  return Number(index);
};

export const padSize = (size: number): Uint8Array => {
  const res = new Uint8Array(4);

  res[3] = size & 0xff;
  res[2] = (size >> 8) & 0xff;
  res[1] = (size >> 16) & 0xff;
  res[0] = (size >> 24) & 0xff;

  return res;
};

export const unpadSize = (size: Uint8Array): number => {
  return size[3] | (size[2] << 8) | (size[1] << 16) | (size[0] << 24);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
