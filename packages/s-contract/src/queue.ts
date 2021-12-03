// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call } from './types';

import { Sealer } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { fromBase64, hexToU8a, isValidHex, isValidSubstrateAddress, stringToU8a, toBase64, trimEnding, u8aToHex, u8aToString } from '@skyekiwi/util';

export class Queue {
  #file: File
  #sealer: Sealer
  #calls: Call[]

  constructor (file: File, sealer: Sealer) {
    this.#file = file;
    this.#sealer = sealer;
    this.#calls = [];
  }

  public async init () {
    try {
      const logsRaw = await this.#file.readAll();
      const logs = logsRaw.split('|');

      for (const log of logs) {
        try {
          this.#calls.push(this.decodeCall(log));
        } catch (err) {
          // pass
          // console.log(err)
        }
      }
    } catch (err) {
      // pass
      // the log is empty
    }
  }

  public unlockSealer (key: Uint8Array): void {
    this.#sealer.unlock(key);
  }

  public decodeCall (call: string): Call {
    let _call = call;
    let encrypted = false;

    if (isValidHex(call)) {
      encrypted = true;
      _call = u8aToString(this.#sealer.decrypt(hexToU8a(call)));
    }

    const oneCall = _call.split('?');

    return {
      encrypted: encrypted,
      methodName: fromBase64(oneCall[0]),
      origin: fromBase64(oneCall[1]),
      parameters: fromBase64(oneCall[2])
    } as Call;
  }

  public encodeCall (call: Call): string {
    if (call.methodName.length < 0 || call.methodName.length > 32) {
      throw new Error('methodName must be between 0 - 32 bytes - calls/encodeCall');
    }

    if (call.parameters.length < 0 || call.parameters.length > 128) {
      throw new Error('parameters must be between 0 - 128 bytes - calls/encodeCall');
    }

    if (!isValidSubstrateAddress(call.origin)) {
      throw new Error('origin must be a valid Substrate address - calls/encodeCall');
    }

    const callString = `${toBase64(call.methodName)}?${toBase64(call.origin)}?${toBase64(call.parameters)}`;

    if (call.encrypted) {
      return u8aToHex(this.#sealer.encrypt(stringToU8a(callString), this.#sealer.getAuthorKey()));
    }

    return callString;
  }

  public async writeCalls (path: string): Promise<void> {
    let currentCalls = '';

    for (const call of this.#calls) {
      currentCalls = currentCalls + this.encodeCall(call) + '|';
    }

    currentCalls = trimEnding(currentCalls);
    await File.writeFile(stringToU8a(currentCalls), path, 'w');
  }

  public parseAndPushCall (call: string): void {
    if (!this.#calls) {
      throw new Error('must initialize first - s-contract/calls');
    }

    const _call = this.decodeCall(call);

    this.#calls.push(_call);
  }

  public pushCall (call: Call): void {
    this.#calls.push(call);
  }

  public getCalls (): Call[] {
    return this.#calls;
  }
}
