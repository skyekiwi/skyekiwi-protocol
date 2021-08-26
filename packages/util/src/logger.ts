// Copyright 2021 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

// fatal = 60
// error = 50
// warn = 40
// info = 30
// debug = 20
// trace = 10
// silent = inf

import type { Logger } from './types';

import pino from 'pino';

const logger = pino({
  level: 'info',
  prettyPrint: {
    colorize: true,
    ignore: 'hostname',
    singleLine: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss'
  }
});

const getLogger = (module: string): Logger => {
  return logger.child({
    module: module
  });
};

export { getLogger };
