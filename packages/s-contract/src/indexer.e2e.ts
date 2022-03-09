// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';

import { Indexer } from './indexer';

describe('@skyekiwi/s-contract/indexer', function () {
  test('upstream/downstream contract without initial state', async () => {
    const provider = new WsProvider('ws://localhost:9944');
    const api = await ApiPromise.create({ provider: provider });

    const indexer = new Indexer();

    indexer.init();

    await indexer.fetchOnce(api, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
    await indexer.initializeLocalMetadata();
    await indexer.fetchAll(api);

    await indexer.writeAll();

    await provider.disconnect();
  });
});
