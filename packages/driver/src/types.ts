// Copyright 2021-2022 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type SecretContract = {
  initialState: Uint8Array,
  secretId?: number,
  wasmBlob: Uint8Array,
}
