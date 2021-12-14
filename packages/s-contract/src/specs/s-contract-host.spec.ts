// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SContractHost } from '../host';

describe('@skyekiwi/s-contract', function () {
  test('mock blockchain dispatching queue', async () => {
    const host = new SContractHost();

    await host.mockMainLoop(10);
  });
});
