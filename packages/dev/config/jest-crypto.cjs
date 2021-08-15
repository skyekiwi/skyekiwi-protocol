// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
const crypto = require('crypto');

Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: (arr) =>
      crypto
        .randomBytes(arr.length)
        .reduce((arr, value, index) => {
          arr[index] = value;

          return arr;
        }, arr)
  }
});
