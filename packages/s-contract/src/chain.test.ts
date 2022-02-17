// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

// import { Chain } from './chain';
// import { ShardManager } from './shard';

// require('dotenv').config();

// describe('@skyekiwi/s-contract/chain', function () {
//   test('subscribe to new header', async () => {
//     const chain = new Chain();
//     const shard = new ShardManager([0]);

//     await chain.init();
//     await shard.init();

//     await chain.subscribeNewBlock(
//       // 1. hook to run every new block
//       async (blockNumber) => {
//         // if (blockNumber % 20 === 0) {
//         await shard.maybeRegisterSecretKeeper(blockNumber);
//         await shard.fetchShardInfo();
//         await shard.maybeSubmitExecutionReport(blockNumber);
//         // }
//       },

//       // 2. hook to run every new contract deployed
//       async () => {

//       },

//       // 3. hook to run every new call received
//       async () => {

//       }

//     );
//   });
// });
