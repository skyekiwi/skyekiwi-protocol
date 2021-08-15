// Copyright 2021 @skyekiwi/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

// adapted from @polkadot/dev
// Copyright 2017-2021 @polkadot/dev authors & contributors
//
// Restore old babylon behavior for istanbul.
// https://github.com/babel/babel/pull/6836
// https://github.com/istanbuljs/istanbuljs/issues/119
module.exports = function () {
  return {
    visitor: {
      Program (programPath) {
        programPath.traverse({
          ArrowFunctionExpression (path) {
            const node = path.node;

            node.expression = node.body.type !== 'BlockStatement';
          }
        });
      }
    }
  };
};
