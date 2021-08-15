// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
module.exports = {
  exclude: '**/*+(index|e2e|spec|types).ts',
  excludeExternals: true,
  excludeNotExported: true,
  excludePrivate: true,
  excludeProtected: true,
  hideGenerator: true,
  includeDeclarations: false,
  module: 'commonjs',
  moduleResolution: 'node',
  name: 'SkyeKiwi Protocol',
  out: 'docs',
  stripInternal: 'true',
  theme: 'markdown'
};
