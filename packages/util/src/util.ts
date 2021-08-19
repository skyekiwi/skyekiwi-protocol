// Copyright 2021 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

const hexToU8a = (hex: string): Uint8Array => {
  if (isValidHex(hex)) {
    return new Uint8Array(hex.match(/[0-9A-Fa-f]{1,2}/g).map((byte) => parseInt(byte, 16)));
  } else {
    throw new Error('invalid hex string: Util.hexToU8a');
  }
};

const u8aToHex = (bytes: Uint8Array): string =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const isValidHex = (str: string): boolean => {
  return (str.length & 1) === 0 &&
    (/^[0-9A-Fa-f]*$/g).test(str);
};

const numberPadding = (n: number): string => {
  return String(n).padStart(16, '0');
};

const trimEnding = (str: string): string => {
  const len = str.length;

  if (str[len - 1] === '|' || str[len - 1] === '-' || str[len - 1] === ' ') {
    return str.substring(0, len - 1);
  } else return str;
};

const stringToU8a = (str: string): Uint8Array => {
  return (new TextEncoder()).encode(str);
};

const u8aToString = (u8a: Uint8Array): string => {
  return (new TextDecoder('utf-8')).decode(u8a);
};

export { hexToU8a, u8aToHex, isValidHex, numberPadding, trimEnding, stringToU8a, u8aToString };