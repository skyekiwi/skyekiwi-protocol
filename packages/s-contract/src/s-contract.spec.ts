// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call } from './types';

import fs from 'fs';
import path from 'path';
import { randomBytes } from 'tweetnacl';

import { DefaultSealer } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { u8aToHex } from '@skyekiwi/util';

import { Queue, State } from '.';

const queuePath = path.join(__dirname, '../mock/queue');
const statePath = path.join(__dirname, '../mock/state');

describe('@skyekiwi/s-contract', function () {
  test('encode/decode call queue', async () => {
    const sealer = new DefaultSealer();

    const queueFile = new File({
      fileName: 'queue',
      readStream: fs.createReadStream(queuePath)
    });

    const stateFile = new File({
      fileName: 'state',
      readStream: fs.createReadStream(statePath)
    });

    const state = new State(stateFile);
    const queue = new Queue(queueFile, sealer);

    await state.init();
    state.injectSealer(queue);

    await queue.init();

    const call1: Call = {
      encrypted: true,
      methodName: 'set_greeting',
      origin: 'cTMsqwDQHwhHBfvHAUiLS3JTXAJEEQ1w9DZevGuMJJX1xKndQ',
      parameters: u8aToHex(randomBytes(40))
    };

    const call2: Call = {
      encrypted: false,
      methodName: 'set_greeting',
      origin: 'cTMsqwDQHwhHBfvHAUiLS3JTXAJEEQ1w9DZevGuMJJX1xKndQ',
      parameters: u8aToHex(randomBytes(40))
    };

    await queue.init();
    const calls = queue.getCalls();

    queue.pushCall(call1);
    queue.pushCall(call2);
    await queue.writeCalls(queuePath);

    calls.push(call1);
    calls.push(call2);
    expect(queue.getCalls()).toEqual(calls);
  });
});
