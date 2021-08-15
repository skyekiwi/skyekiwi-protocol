#!/usr/bin/env node
// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
console.log('$ gh-pages', process.argv.slice(2).join(' '));

require('gh-pages/bin/gh-pages')(process.argv)
  .then(() => {
    process.stdout.write('Published\n');
  })
  .catch((error) => {
    process.stderr.write(`${error.message}\n`, () => process.exit(1));
  });
