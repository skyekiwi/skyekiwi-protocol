#!/usr/bin/env node
// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
const execSync = require('./execSync.cjs');

console.log('$ skyekiwi-dev-run-prettier', process.argv.slice(2).join(' '));

execSync(`yarn skyekiwi-exec-prettier --write ${__dirname}`);
