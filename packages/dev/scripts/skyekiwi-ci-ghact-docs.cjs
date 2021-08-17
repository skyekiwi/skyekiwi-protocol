#!/usr/bin/env node
// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
const execSync = require('./execSync.cjs');

const repo = `https://${process.env.GH_PAT}@github.com/${process.env.GITHUB_REPOSITORY}.git`;

console.log('$ skyekiwi-ci-ghact-docs', process.argv.slice(2).join(' '));

execSync('git config push.default simple');
execSync('git config merge.ours.driver true');
execSync('git config user.name "Github Actions"');
execSync('git config user.email "action@github.com"');
execSync('git checkout master');

execSync('yarn run docs');

execSync(`yarn skyekiwi-exec-ghpages --dotfiles --repo ${repo} --dist ${process.env.GH_PAGES_SRC} --dest .`, true);
