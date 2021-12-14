// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

export default {
  AccountInfo: 'AccountInfoWithTripleRefCount',
  ActiveEraInfo: {
    index: 'EraIndex',
    start: 'Option<u64>'
  },
  Address: 'MultiAddress',
  AliveContractInfo: {
    _reserved: 'Option<Null>',
    codeHash: 'CodeHash',
    deductBlock: 'BlockNumber',
    lastWrite: 'Option<BlockNumber>',
    pairCount: 'u32',
    rentAllowance: 'Balance',
    rentPayed: 'Balance',
    storageSize: 'u32',
    trieId: 'TrieId'
  },
  AuthorityState: {
    _enum: [
      'Working',
      'Waiting'
    ]
  },
  EraIndex: 'u32',
  Error: {
    _enum: [
      'VaultIdError',
      'AccessDenied',
      'MetadataNotValid',
      'MathError'
    ]
  },
  FullIdentification: 'AccountId',
  LookupSource: 'MultiAddress',
  UnappliedSlash: {
    reporters: 'Vec<AccountId>',
    validator: 'AccountId'
  }
};
