// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type Call = {
  encrypted: boolean,
  methodName: string,
  origin: string,
  parameters: string
};
