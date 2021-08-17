"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLogger = void 0;

var _pino = _interopRequireDefault(require("pino"));

// Copyright 2021 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0
// fatal = 60
// error = 50
// warn = 40
// info = 30
// debug = 20
// trace = 10
// silent = inf
const logger = (0, _pino.default)({
  level: 'info',
  prettyPrint: {
    colorize: true,
    ignore: 'hostname',
    singleLine: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss'
  }
});

const getLogger = module => {
  return logger.child({
    module: module
  });
};

exports.getLogger = getLogger;