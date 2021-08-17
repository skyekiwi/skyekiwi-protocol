const polkadotUtil = (function (exports) {
  'use strict';

  const global = window;

  function tryStringify (o) {
    try { return JSON.stringify(o) } catch(e) { return '"[Circular]"' }
  }

  var quickFormatUnescaped = format$1;

  function format$1(f, args, opts) {
    var ss = (opts && opts.stringify) || tryStringify;
    var offset = 1;
    if (typeof f === 'object' && f !== null) {
      var len = args.length + offset;
      if (len === 1) return f
      var objects = new Array(len);
      objects[0] = ss(f);
      for (var index = 1; index < len; index++) {
        objects[index] = ss(args[index]);
      }
      return objects.join(' ')
    }
    if (typeof f !== 'string') {
      return f
    }
    var argLen = args.length;
    if (argLen === 0) return f
    var str = '';
    var a = 1 - offset;
    var lastPos = -1;
    var flen = (f && f.length) || 0;
    for (var i = 0; i < flen;) {
      if (f.charCodeAt(i) === 37 && i + 1 < flen) {
        lastPos = lastPos > -1 ? lastPos : 0;
        switch (f.charCodeAt(i + 1)) {
          case 100: // 'd'
          case 102: // 'f'
            if (a >= argLen)
              break
            if (lastPos < i)
              str += f.slice(lastPos, i);
            if (args[a] == null)  break
            str += Number(args[a]);
            lastPos = i = i + 2;
            break
          case 105: // 'i'
            if (a >= argLen)
              break
            if (lastPos < i)
              str += f.slice(lastPos, i);
            if (args[a] == null)  break
            str += Math.floor(Number(args[a]));
            lastPos = i = i + 2;
            break
          case 79: // 'O'
          case 111: // 'o'
          case 106: // 'j'
            if (a >= argLen)
              break
            if (lastPos < i)
              str += f.slice(lastPos, i);
            if (args[a] === undefined) break
            var type = typeof args[a];
            if (type === 'string') {
              str += '\'' + args[a] + '\'';
              lastPos = i + 2;
              i++;
              break
            }
            if (type === 'function') {
              str += args[a].name || '<anonymous>';
              lastPos = i + 2;
              i++;
              break
            }
            str += ss(args[a]);
            lastPos = i + 2;
            i++;
            break
          case 115: // 's'
            if (a >= argLen)
              break
            if (lastPos < i)
              str += f.slice(lastPos, i);
            str += String(args[a]);
            lastPos = i + 2;
            i++;
            break
          case 37: // '%'
            if (lastPos < i)
              str += f.slice(lastPos, i);
            str += '%';
            lastPos = i + 2;
            i++;
            a--;
            break
        }
        ++a;
      }
      ++i;
    }
    if (lastPos === -1)
      return f
    else if (lastPos < flen) {
      str += f.slice(lastPos);
    }

    return str
  }

  const format = quickFormatUnescaped;

  var browser = pino;

  const _console = pfGlobalThisOrFallback().console || {};
  const stdSerializers = {
    mapHttpRequest: mock,
    mapHttpResponse: mock,
    wrapRequestSerializer: passthrough,
    wrapResponseSerializer: passthrough,
    wrapErrorSerializer: passthrough,
    req: mock,
    res: mock,
    err: asErrValue
  };

  function shouldSerialize (serialize, serializers) {
    if (Array.isArray(serialize)) {
      const hasToFilter = serialize.filter(function (k) {
        return k !== '!stdSerializers.err'
      });
      return hasToFilter
    } else if (serialize === true) {
      return Object.keys(serializers)
    }

    return false
  }

  function pino (opts) {
    opts = opts || {};
    opts.browser = opts.browser || {};

    const transmit = opts.browser.transmit;
    if (transmit && typeof transmit.send !== 'function') { throw Error('pino: transmit option must have a send function') }

    const proto = opts.browser.write || _console;
    if (opts.browser.write) opts.browser.asObject = true;
    const serializers = opts.serializers || {};
    const serialize = shouldSerialize(opts.browser.serialize, serializers);
    let stdErrSerialize = opts.browser.serialize;

    if (
      Array.isArray(opts.browser.serialize) &&
      opts.browser.serialize.indexOf('!stdSerializers.err') > -1
    ) stdErrSerialize = false;

    const levels = ['error', 'fatal', 'warn', 'info', 'debug', 'trace'];

    if (typeof proto === 'function') {
      proto.error = proto.fatal = proto.warn =
      proto.info = proto.debug = proto.trace = proto;
    }
    if (opts.enabled === false) opts.level = 'silent';
    const level = opts.level || 'info';
    const logger = Object.create(proto);
    if (!logger.log) logger.log = noop;

    Object.defineProperty(logger, 'levelVal', {
      get: getLevelVal
    });
    Object.defineProperty(logger, 'level', {
      get: getLevel,
      set: setLevel
    });

    const setOpts = {
      transmit,
      serialize,
      asObject: opts.browser.asObject,
      levels,
      timestamp: getTimeFunction(opts)
    };
    logger.levels = pino.levels;
    logger.level = level;

    logger.setMaxListeners = logger.getMaxListeners =
    logger.emit = logger.addListener = logger.on =
    logger.prependListener = logger.once =
    logger.prependOnceListener = logger.removeListener =
    logger.removeAllListeners = logger.listeners =
    logger.listenerCount = logger.eventNames =
    logger.write = logger.flush = noop;
    logger.serializers = serializers;
    logger._serialize = serialize;
    logger._stdErrSerialize = stdErrSerialize;
    logger.child = child;

    if (transmit) logger._logEvent = createLogEventShape();

    function getLevelVal () {
      return this.level === 'silent'
        ? Infinity
        : this.levels.values[this.level]
    }

    function getLevel () {
      return this._level
    }
    function setLevel (level) {
      if (level !== 'silent' && !this.levels.values[level]) {
        throw Error('unknown level ' + level)
      }
      this._level = level;

      set(setOpts, logger, 'error', 'log'); // <-- must stay first
      set(setOpts, logger, 'fatal', 'error');
      set(setOpts, logger, 'warn', 'error');
      set(setOpts, logger, 'info', 'log');
      set(setOpts, logger, 'debug', 'log');
      set(setOpts, logger, 'trace', 'log');
    }

    function child (bindings, childOptions) {
      if (!bindings) {
        throw new Error('missing bindings for child Pino')
      }
      childOptions = childOptions || {};
      if (serialize && bindings.serializers) {
        childOptions.serializers = bindings.serializers;
      }
      const childOptionsSerializers = childOptions.serializers;
      if (serialize && childOptionsSerializers) {
        var childSerializers = Object.assign({}, serializers, childOptionsSerializers);
        var childSerialize = opts.browser.serialize === true
          ? Object.keys(childSerializers)
          : serialize;
        delete bindings.serializers;
        applySerializers([bindings], childSerialize, childSerializers, this._stdErrSerialize);
      }
      function Child (parent) {
        this._childLevel = (parent._childLevel | 0) + 1;
        this.error = bind(parent, bindings, 'error');
        this.fatal = bind(parent, bindings, 'fatal');
        this.warn = bind(parent, bindings, 'warn');
        this.info = bind(parent, bindings, 'info');
        this.debug = bind(parent, bindings, 'debug');
        this.trace = bind(parent, bindings, 'trace');
        if (childSerializers) {
          this.serializers = childSerializers;
          this._serialize = childSerialize;
        }
        if (transmit) {
          this._logEvent = createLogEventShape(
            [].concat(parent._logEvent.bindings, bindings)
          );
        }
      }
      Child.prototype = this;
      return new Child(this)
    }
    return logger
  }

  pino.levels = {
    values: {
      fatal: 60,
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10
    },
    labels: {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal'
    }
  };

  pino.stdSerializers = stdSerializers;
  pino.stdTimeFunctions = Object.assign({}, { nullTime, epochTime, unixTime, isoTime });

  function set (opts, logger, level, fallback) {
    const proto = Object.getPrototypeOf(logger);
    logger[level] = logger.levelVal > logger.levels.values[level]
      ? noop
      : (proto[level] ? proto[level] : (_console[level] || _console[fallback] || noop));

    wrap(opts, logger, level);
  }

  function wrap (opts, logger, level) {
    if (!opts.transmit && logger[level] === noop) return

    logger[level] = (function (write) {
      return function LOG () {
        const ts = opts.timestamp();
        const args = new Array(arguments.length);
        const proto = (Object.getPrototypeOf && Object.getPrototypeOf(this) === _console) ? _console : this;
        for (var i = 0; i < args.length; i++) args[i] = arguments[i];

        if (opts.serialize && !opts.asObject) {
          applySerializers(args, this._serialize, this.serializers, this._stdErrSerialize);
        }
        if (opts.asObject) write.call(proto, asObject(this, level, args, ts));
        else write.apply(proto, args);

        if (opts.transmit) {
          const transmitLevel = opts.transmit.level || logger.level;
          const transmitValue = pino.levels.values[transmitLevel];
          const methodValue = pino.levels.values[level];
          if (methodValue < transmitValue) return
          transmit(this, {
            ts,
            methodLevel: level,
            methodValue,
            transmitLevel,
            transmitValue: pino.levels.values[opts.transmit.level || logger.level],
            send: opts.transmit.send,
            val: logger.levelVal
          }, args);
        }
      }
    })(logger[level]);
  }

  function asObject (logger, level, args, ts) {
    if (logger._serialize) applySerializers(args, logger._serialize, logger.serializers, logger._stdErrSerialize);
    const argsCloned = args.slice();
    let msg = argsCloned[0];
    const o = {};
    if (ts) {
      o.time = ts;
    }
    o.level = pino.levels.values[level];
    let lvl = (logger._childLevel | 0) + 1;
    if (lvl < 1) lvl = 1;
    // deliberate, catching objects, arrays
    if (msg !== null && typeof msg === 'object') {
      while (lvl-- && typeof argsCloned[0] === 'object') {
        Object.assign(o, argsCloned.shift());
      }
      msg = argsCloned.length ? format(argsCloned.shift(), argsCloned) : undefined;
    } else if (typeof msg === 'string') msg = format(argsCloned.shift(), argsCloned);
    if (msg !== undefined) o.msg = msg;
    return o
  }

  function applySerializers (args, serialize, serializers, stdErrSerialize) {
    for (const i in args) {
      if (stdErrSerialize && args[i] instanceof Error) {
        args[i] = pino.stdSerializers.err(args[i]);
      } else if (typeof args[i] === 'object' && !Array.isArray(args[i])) {
        for (const k in args[i]) {
          if (serialize && serialize.indexOf(k) > -1 && k in serializers) {
            args[i][k] = serializers[k](args[i][k]);
          }
        }
      }
    }
  }

  function bind (parent, bindings, level) {
    return function () {
      const args = new Array(1 + arguments.length);
      args[0] = bindings;
      for (var i = 1; i < args.length; i++) {
        args[i] = arguments[i - 1];
      }
      return parent[level].apply(this, args)
    }
  }

  function transmit (logger, opts, args) {
    const send = opts.send;
    const ts = opts.ts;
    const methodLevel = opts.methodLevel;
    const methodValue = opts.methodValue;
    const val = opts.val;
    const bindings = logger._logEvent.bindings;

    applySerializers(
      args,
      logger._serialize || Object.keys(logger.serializers),
      logger.serializers,
      logger._stdErrSerialize === undefined ? true : logger._stdErrSerialize
    );
    logger._logEvent.ts = ts;
    logger._logEvent.messages = args.filter(function (arg) {
      // bindings can only be objects, so reference equality check via indexOf is fine
      return bindings.indexOf(arg) === -1
    });

    logger._logEvent.level.label = methodLevel;
    logger._logEvent.level.value = methodValue;

    send(methodLevel, logger._logEvent, val);

    logger._logEvent = createLogEventShape(bindings);
  }

  function createLogEventShape (bindings) {
    return {
      ts: 0,
      messages: [],
      bindings: bindings || [],
      level: { label: '', value: 0 }
    }
  }

  function asErrValue (err) {
    const obj = {
      type: err.constructor.name,
      msg: err.message,
      stack: err.stack
    };
    for (const key in err) {
      if (obj[key] === undefined) {
        obj[key] = err[key];
      }
    }
    return obj
  }

  function getTimeFunction (opts) {
    if (typeof opts.timestamp === 'function') {
      return opts.timestamp
    }
    if (opts.timestamp === false) {
      return nullTime
    }
    return epochTime
  }

  function mock () { return {} }
  function passthrough (a) { return a }
  function noop () {}

  function nullTime () { return false }
  function epochTime () { return Date.now() }
  function unixTime () { return Math.round(Date.now() / 1000.0) }
  function isoTime () { return new Date(Date.now()).toISOString() } // using Date.now() for testability

  /* eslint-disable */
  /* istanbul ignore next */
  function pfGlobalThisOrFallback () {
    function defd (o) { return typeof o !== 'undefined' && o }
    try {
      if (typeof globalThis !== 'undefined') return globalThis
      Object.defineProperty(Object.prototype, 'globalThis', {
        get: function () {
          delete Object.prototype.globalThis;
          return (this.globalThis = this)
        },
        configurable: true
      });
      return globalThis
    } catch (e) {
      return defd(self) || defd(window) || defd(this) || {}
    }
  }

  // Copyright 2021 @skyekiwi/util authors & contributors
  const logger = browser({
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

  // Copyright 2021 @skyekiwi/util authors & contributors
  // SPDX-License-Identifier: Apache-2.0

  /* eslint-disable node/no-extraneous-import */
  // Ported from
  // https://github.com/crustio/crust.js/blob/main/packages/crust-pin/src/util.ts
  // With minor modifications
  // Licensed under Apache-2.0

  /**
   * Send tx to Crust Network
   * @param {SubmittableExtrinsic} tx substrate-style tx
   * @param {string} seeds tx already been sent
   */
  const sendTx = (extrinsic, signer, logging) => {
    logging = logging === undefined ? false : logging;

    if (logging) {
      console.log('⛓  Send tx to chain...');
    }

    return new Promise((resolve, reject) => {
      extrinsic.signAndSend(signer, ({
        events = [],
        status
      }) => {
        if (logging) {
          console.log(`  ↪ 💸  Transaction status: ${status.type}`);
        }

        if (status.isInvalid || status.isDropped || status.isUsurped || status.isRetracted) {
          reject(new Error('Invalid transaction'));
        }

        if (status.isInBlock) {
          events.forEach(({
            event: {
              method,
              section
            }
          }) => {
            if (section === 'system' && method === 'ExtrinsicFailed') {
              // Error with no detail, just return error
              console.error(`  ↪ ❌  Send transaction(${extrinsic.type}) failed.`);
              resolve(false);
            } else if (method === 'ExtrinsicSuccess') {
              if (logging) {
                console.log(`  ↪ ✅  Send transaction(${extrinsic.type}) success.`);
              }

              resolve(true);
            }
          });
        }
      }).catch(e => {
        reject(e);
      });
    });
  };

  // Copyright 2021 @skyekiwi/util authors & contributors

  const hexToU8a = hex => {
    if (isValidHex(hex)) {
      return new Uint8Array(hex.match(/[0-9A-Fa-f]{1,2}/g).map(byte => parseInt(byte, 16)));
    } else {
      throw new Error('invalid hex string: Util.hexToU8a');
    }
  };

  const u8aToHex = bytes => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

  const isValidHex = str => {
    return (str.length & 1) === 0 && /^[0-9A-Fa-f]*$/g.test(str);
  };

  const numberPadding = n => {
    return String(n).padStart(16, '0');
  };

  const trimEnding = str => {
    const len = str.length;

    if (str[len - 1] === '|' || str[len - 1] === '-' || str[len - 1] === ' ') {
      return str.substring(0, len - 1);
    } else return str;
  };

  exports.getLogger = getLogger;
  exports.hexToU8a = hexToU8a;
  exports.isValidHex = isValidHex;
  exports.numberPadding = numberPadding;
  exports.sendTx = sendTx;
  exports.trimEnding = trimEnding;
  exports.u8aToHex = u8aToHex;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
