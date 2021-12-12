// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

export class Executor {
  constructor() {

  }

  public async execute(
    origin: string,
    methodName: string,
    paramters: string
  ) {
    console.log(origin, methodName, paramters);
    return await this.mockResult();
  }

  public async mockResult() {
    return 'hello!!!!'
  }

}
