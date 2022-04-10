// Copyright 2021-2022 @skyekiwi/metadata authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'tweetnacl';

import { u8aToHex } from '@skyekiwi/util';

import { buildDiffOps, parseDiffOps } from './ops';
import { Diff } from '.';

describe('@skyekiwi/diff', function () {
  test('diff works', () => {
    const old = new Uint8Array([1, 2, 3]);
    const new_ = new Uint8Array([1, 2, 3, 4]);

    const diff = Diff.diff(old, new_);
    const recovered = Diff.patch(diff, old);

    expect(u8aToHex(recovered)).toEqual(u8aToHex(new_));
  });

  test('fuzzing', () => {
    const LEN = 1000;

    const old = randomBytes(LEN);
    const new_ = randomBytes(LEN);

    const diff = Diff.diff(old, new_);

    const recovered = Diff.patch(diff, old);

    expect(u8aToHex(recovered)).toEqual(u8aToHex(new_));
  });

  test('ops serde', () => {
    const LEN = 1000;

    const old = randomBytes(LEN);
    const new_ = randomBytes(LEN);

    const diff = Diff.diff(old, new_);
    const ops = buildDiffOps(diff);
    const recoveredOp = parseDiffOps(ops);

    const recovered = Diff.patch(recoveredOp, old);

    expect(u8aToHex(recovered)).toEqual(u8aToHex(new_));
  });
});
