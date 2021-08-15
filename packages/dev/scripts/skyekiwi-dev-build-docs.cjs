#!/usr/bin/env node
// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');

console.log('$ skyekiwi-dev-build-docs', process.argv.slice(2).join(' '));

let docRoot = path.join(process.cwd(), 'docs');

if (fs.existsSync(docRoot)) {
  docRoot = path.join(process.cwd(), 'build-docs');

  rimraf.sync(docRoot);
  fse.copySync(path.join(process.cwd(), 'docs'), docRoot);
}
