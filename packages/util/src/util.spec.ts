// Copyright 2021-2022 @skyekiwi/util authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as Util from '.';

describe('@skyekiwi/util', function () {
  test('isValidHex', () => {
    const hex = ['aa', 'a', '1234', 'sdjf', 'asdfasdfasdf'];
    const expectedResult = [true, false, true, false, false];

    const result = hex.map(Util.isValidHex);

    expect(result).toEqual(expectedResult);
  });
});
