// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type Call = {
  callIndex: string,
  contractId: string,
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
  highLocalCallIndex: string,
  state: string,
  wasmPath: string
}

 //// REQUESTS
export type RequestInitializeContract = {
  contractId: string,
  highRemoteCallIndex: string
}

export type RequestWriteNewAuthentication = {
  contractId: string,
  authentication: Authentication
}

export type RequestRollup = {
  contractId: string,
  highLocalCallIndex: string,
  highRemoteCallIndex: string
}

export type RequestRolldown = {
  contractId: string,
  highLocalCallIndex: string,
  highRemoteCallIndex: string
}

export type RequestDispatch = {
  calls: Call[]
}
