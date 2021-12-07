// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type Call = {
  callIndex: number,
  encrypted: boolean,
  methodName: string,
  origin: string,
  parameters: string
};

export type Authentication = {
  storageKey: string,
  authOrigin: string
}

export type SContractConfiguration = {
  localStoragePath: string
}

export type Contract = {
  auth: Authentication[],
  contractId: string,
  lastSyncedCallIndex: number,
  state: string,
  wasmPath: string
}
