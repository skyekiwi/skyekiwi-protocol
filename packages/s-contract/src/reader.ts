// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Authentication, Call, Contract } from './types';

import { mnemonicToMiniSecret } from '@polkadot/util-crypto';

import { Sealer } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { fromBase64, hexToU8a, isValidHex, isValidSubstrateAddress, stringToU8a, toBase64, u8aToHex, u8aToString } from '@skyekiwi/util';

export class SContractReader {
  #file: File
  #sealer: Sealer
  #contract: Contract
  #seed: string

  constructor (file: File, sealer: Sealer) {
    this.#file = file;
    this.#sealer = sealer;
  }

  public async init (): Promise<void> {
    try {
      const fullContract = await this.#file.readAll();

      this.#contract = this.decodeContract(fromBase64(fullContract));
    } catch (err) {
      throw new Error('initialization error, file might not be found s-contract/SContractReader/init');
    }
  }

  public unlockSealer (seed: string): void {
    const key = mnemonicToMiniSecret(seed);

    this.#sealer.unlock(key);
  }

  public decodeCall (call: string): Call {
    const _call = call.split('?');

    let callContent = '';
    const callIndex = _call[0];

    let encrypted = false;

    if (isValidHex(_call[1])) {
      encrypted = true;
      callContent = u8aToString(this.#sealer.decrypt(hexToU8a(call)));
    } else {
      callContent = _call[1];
    }

    const oneCall = callContent.split('?');

    return {
      callIndex: callIndex,
      contractId: oneCall[0],
      encrypted: encrypted,
      methodName: fromBase64(oneCall[1]),
      origin: fromBase64(oneCall[2]),
      parameters: fromBase64(oneCall[3])
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

    let callString = `${call.contractId}?${toBase64(call.methodName)}?${toBase64(call.origin)}?${toBase64(call.parameters)}`;

    if (call.encrypted) {
      callString = u8aToHex(this.#sealer.encrypt(stringToU8a(callString), this.#sealer.getAuthorKey()));
    }

    return call.callIndex + '?' + callString;
  }

  public encodeAuth (auth: Authentication): string {
    return toBase64(`${auth.storageKey}?${auth.authOrigin}`);
  }

  public decodeAuth (authStringRaw: string): Authentication {
    const authString = fromBase64(authStringRaw);

    const a = authString.split('?');
    const storageKey = a[0];
    const auth = a[1];

    if (storageKey === undefined) return null;

    return {
      authOrigin: auth,
      storageKey: storageKey
    } as Authentication;
  }

  public encodeContract (seed: string, contract: Contract): string {
    const authString = contract.auth.map(this.encodeAuth).join('|');
    const result = `${contract.contractId}*${seed}*${authString}*${contract.highLocalCallIndex}*${contract.state}*${contract.wasmPath}`;

    return result;
  }

  public decodeContract (contractRaw: string): Contract {
    const contract = contractRaw.split('*');
    const contractId = contract[0];
    const seed = contract[1];

    const auths = contract[2].split('|').map(this.decodeAuth);
    const highLocalCallIndex = contract[3];

    const state = contract[4];
    const wasmPath = contract[5];

    this.unlockSealer(seed);
    this.#seed = seed;

    return {
      auth: auths,
      contractId: contractId,
      highLocalCallIndex: highLocalCallIndex,
      state: state,
      wasmPath: wasmPath
    };
  }

  public writeState (state: string): void {
    this.#contract.state = state;
  }

  public readState (): string {
    return this.#contract.state;
  }

  public writeAuth (auth: Authentication): void {
    this.#contract.auth.push(auth);
  }

  public revokeAuth (auth: Authentication): void {
    this.#contract.auth.forEach((v, i) => {
      if (v === auth) {
        this.#contract.auth.splice(i, 1);
      }
    });
  }

  public getContractId (): string {
    return this.#contract.contractId;
  }

  public async writeToFile (path: string): Promise<void> {
    await File.writeFile(
      stringToU8a(
        toBase64(this.encodeContract(this.#seed, this.#contract))
      ), path, 'w');
  }

  public forceInject (seed: string, contract: Contract): void {
    this.#contract = contract;
    this.#seed = seed;
    this.#sealer.unlock(mnemonicToMiniSecret(seed));
  }

  public getHighLocalCallIndex (): string {
    return this.#contract.highLocalCallIndex;
  }

  public readContract (): Contract {
    console.log(this.#contract);

    return this.#contract;
  }
}
