#!/usr/bin/env node
// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
const chalk = require('chalk');

if (process.env.npm_execpath.includes('yarn')) {
  process.exit(0);
}

const blank = ''.padStart(75);

console.error(
  chalk.white.bold.bgRed(
    `${blank}\n   ${chalk.bold('FATAL: The use of yarn is required, install via npm is not supported.')}   \n${blank}`
  )
);
console.error(`
    Technical explanation: All the projects in the ${chalk.bold('@skyekiwi')} family use
    yarn workspaces, along with hoisting of dependencies. Currently only
    yarn supports package.json workspaces, hence the limitation.

    If yarn is not available, you can get it from https://yarnpkg.com/

`);

process.exit(1);
