// Copyright 2021-2022 @skyekiwi authors & contributors
// SPDX-License-Identifier: Apache-2.0

const config = require('@skyekiwi/dev/config/jest.cjs');

module.exports = Object.assign({}, config, {
  moduleNameMapper: {
    '@skyekiwi/crypto(.*)$': '<rootDir>/packages/crypto/src/$1',
    '@skyekiwi/driver(.*)$': '<rootDir>/packages/driver/src/$1',
    '@skyekiwi/file(.*)$': '<rootDir>/packages/file/src/$1',
    '@skyekiwi/ipfs(.*)$': '<rootDir>/packages/ipfs/src/$1',
    '@skyekiwi/metadata(.*)$': '<rootDir>/packages/metadata/src/$1',
    '@skyekiwi/s-contract(.*)$': '<rootDir>/packages/wasm-contract/src/$1',
    '@skyekiwi/secret-registry(.*)$': '<rootDir>/packages/secret-registry/src/$1',
    '@skyekiwi/util(.*)$': '<rootDir>/packages/util/src/$1'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/packages/crypto/build',
    '<rootDir>/packages/dev/build',
    '<rootDir>/packages/driver/build',
    '<rootDir>/packages/file/build',
    '<rootDir>/packages/ipfs/build',
    '<rootDir>/packages/metadata/build',
    '<rootDir>/packages/s-contract/build',
    '<rootDir>/packages/secret-registry/build',
    '<rootDir>/packages/util/build'
  ],
  testTimeout: 3_000_000,
  transformIgnorePatterns: [
    '/node_modules/(?!@polkadot|@babel/runtime/helpers/esm/)'
  ]
});
