// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SContractConfiguration } from './types';

import fs from 'fs';
import path from 'path';

import { DefaultSealer } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';
import { indexToString } from '@skyekiwi/util';

import { SContractPersistent, SContractReader } from '.';
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

    const sContract = new SContractReader(contractFile, new DefaultSealer());

    await sContract.init();

    const id = await SContractPersistent.rollup(config, sContract);
    const instance = await SContractPersistent.initialize(config, indexToString(id), 'QmfRE8M9X3iiJzvVrsHUyDrYywsspgRCqVj9CNS3sqspqx');

    const state = JSON.stringify({
      a: 'hello',
      b: 'hahahah'
    });

    instance.writeState(state);

    await instance.init();

    expect(instance.readState()).toEqual(state);
  });
});
