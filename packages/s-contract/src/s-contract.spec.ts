// Copyright 2021 @skyekiwi/driver authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';

import { DefaultSealer } from '@skyekiwi/crypto';
import { File } from '@skyekiwi/file';

import { SContractReader } from '.';
// import { mnemonicGenerate } from '@polkadot/util-crypto';

const contractPath = path.join(__dirname, '../mock/contract');

describe('@skyekiwi/s-contract', function () {
  test('encode/decode call queue', async () => {
    const sealer = new DefaultSealer();

    // const seed = mnemonicGenerate();
    // const contract = {
    //   auth: [],
    //   contractId: "0x00008",
    //   lastSyncedCallIndex: 0,
    //   state: '{}',
    //   wasmPath: 'QmfRE8M9X3iiJzvVrsHUyDrYywsspgRCqVj9CNS3sqspqx'
    // } as Contract;
    // const sContract = new SContract(new File({
    //   fileName: 'contract',
    //   readStream: fs.createReadStream(contractPath)
    // }), sealer);
    // const sContract = new SContract(new File({
    //   fileName: 'contract',
    //   readStream: fs.createReadStream(contractPath)
    // }), sealer);

    // sContract.forceInject(seed, contract)

    const sContract = new SContractReader(new File({
      fileName: 'contract',
      readStream: fs.createReadStream(contractPath)
    }), sealer);

    await sContract.init();

    const state = JSON.stringify({
      a: 'hello',
      b: 'hahahah'
    });

    sContract.writeState(state);

    expect(sContract.readState()).toEqual(state);
  });
});
