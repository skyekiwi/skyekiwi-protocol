// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { File } from '@skyekiwi/file';
import { fromBase64, hexToU8a, stringToU8a, toBase64, u8aToHex } from '@skyekiwi/util';

import { Queue } from './queue';

export class State {
  #key: Uint8Array
  #file: File
  #state: string

  constructor (state: File) {
    this.#file = state;
  }

  public async init () {
    try {
      const logsRaw = await this.#file.readAll();
      const logs = logsRaw.split('|');

      this.#key = hexToU8a(fromBase64(logs[0]));
      this.#state = fromBase64(logs[1]);
    } catch (err) {
      throw new Error('state file initialization error - s-contract/state/init');
      // pass
      // the state file is empty
    }
  }

  public injectSealer (queue: Queue) {
    queue.unlockSealer(this.#key);
  }

  public getState (): string {
    return this.#state;
  }

  public updateState (state: string): void {
    this.#state = state;
  }

  public async writeState (path: string): Promise<void> {
    const content = toBase64(u8aToHex(this.#key)) + '|' + toBase64(this.#state);

    await File.writeFile(stringToU8a(content), path, 'w');
  }

  // not used for production
  public forceUpdate (key: Uint8Array, state: string) {
    this.#key = key;
    this.#state = state;
  }
}
