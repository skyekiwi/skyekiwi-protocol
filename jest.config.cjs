// Copyright 2021 @skyekiwi authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@skyekiwi/dev/config/jest.cjs');

module.exports = Object.assign({}, config, {
  moduleNameMapper: {
    '@skyekiwi/crust(.*)$': '<rootDir>/packages/crust/src/$1',
    '@skyekiwi/crypto(.*)$': '<rootDir>/packages/crypto/src/$1',
    '@skyekiwi/driver(.*)$': '<rootDir>/packages/driver/src/$1',
    '@skyekiwi/file(.*)$': '<rootDir>/packages/file/src/$1',
    '@skyekiwi/ipfs(.*)$': '<rootDir>/packages/ipfs/src/$1',
    '@skyekiwi/metadata(.*)$': '<rootDir>/packages/metadata/src/$1',
    '@skyekiwi/util(.*)$': '<rootDir>/packages/util/src/$1',
    '@skyekiwi/wasm-contract(.*)$': '<rootDir>/packages/wasm-contract/src/$1'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/packages/crust/build',
    '<rootDir>/packages/crypto/build',
    '<rootDir>/packages/dev/build',
    '<rootDir>/packages/driver/build',
    '<rootDir>/packages/file/build',
    '<rootDir>/packages/ipfs/build',
    '<rootDir>/packages/metadata/build',
    '<rootDir>/packages/util/build',
    '<rootDir>/packages/wasm/build'
  ],
  testTimeout: 30000,
  transformIgnorePatterns: ['/node_modules/(?!@skyekiwi)']
});
