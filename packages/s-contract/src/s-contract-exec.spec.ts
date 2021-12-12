// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SContractConfiguration } from './types';

import fs from 'fs';
import path from 'path';

import { DefaultSealer } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { indexToString } from '@skyekiwi/util';

import { SContract, SContractExecutor } from '.';
// import { mnemonicGenerate } from '@polkadot/util-crypto';

const contractPath = path.join(__dirname, '../mock/contract');

describe('@skyekiwi/s-contract', function () {
  test('contract init/rollup e2e', async () => {
    const config: SContractConfiguration = {
      localStoragePath: path.join(__dirname, '../mock/downstreamed/')
    };

    const contractFile = new File({
      fileName: 'contract',
      readStream: fs.createReadStream(contractPath)
    });

    const sContract = new SContract(contractFile, new DefaultSealer());
    await sContract.init();

    const id = await SContractExecutor.rollup(config, sContract);
    const instance = await SContractExecutor.initialize(config, indexToString(id), 'QmfRE8M9X3iiJzvVrsHUyDrYywsspgRCqVj9CNS3sqspqx');
    await instance.init();

    console.log(instance.readContract());
  });
});
