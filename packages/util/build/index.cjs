"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "getLogger", {
  enumerable: true,
  get: function () {
    return _logger.getLogger;
  }
});
Object.defineProperty(exports, "sendTx", {
  enumerable: true,
  get: function () {
    return _sendTx.sendTx;
  }
});
exports.trimEnding = exports.numberPadding = exports.isValidHex = exports.u8aToHex = exports.hexToU8a = void 0;

var _logger = require("./logger.cjs");

var _sendTx = require("./sendTx.cjs");

// Copyright 2021 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0
// import { stringToU8a, u8aToString } from '@polkadot/util';
const hexToU8a = hex => {
  if (isValidHex(hex)) {
    return new Uint8Array(hex.match(/[0-9A-Fa-f]{1,2}/g).map(byte => parseInt(byte, 16)));
  } else {
    throw new Error('invalid hex string: Util.hexToU8a');
  }
};

exports.hexToU8a = hexToU8a;

const u8aToHex = bytes => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

exports.u8aToHex = u8aToHex;

const isValidHex = str => {
  return (str.length & 1) === 0 && /^[0-9A-Fa-f]*$/g.test(str);
};

exports.isValidHex = isValidHex;

const numberPadding = n => {
  return String(n).padStart(16, '0');
};

exports.numberPadding = numberPadding;

const trimEnding = str => {
  const len = str.length;

  if (str[len - 1] === '|' || str[len - 1] === '-' || str[len - 1] === ' ') {
    return str.substring(0, len - 1);
  } else return str;
};

exports.trimEnding = trimEnding;