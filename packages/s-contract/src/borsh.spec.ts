// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';

import { hexToU8a, u8aToHex } from '@skyekiwi/util';

import { buildCall, buildOutcome, Call, Outcome, parseCall,
  parseOutcome } from './borsh';

/* eslint-disable sort-keys, camelcase */
describe('@skyekiwi/s-contract/borsh', function () {
  test('encode/decode calls works', () => {
    const call = new Call({
      transaction_action: 'create_account',
      receiver: 'test',
      amount: new BN(0x100, 16),
      wasm_file: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const buf = buildCall(call);
    const parsedCall = parseCall(buf);

    expect(parsedCall.transaction_action).toEqual(call.transactionAction);
    expect(parsedCall.receiver).toEqual(call.receiver);
    expect(parsedCall.amount.toNumber()).toEqual(call.amount.toNumber());
    expect(parsedCall.wasm_file).toEqual(call.wasm_file);
    expect(parsedCall.method).toEqual(call.method);
    expect(parsedCall.args).toEqual(call.args);
    expect(parsedCall.to).toEqual(call.to);
  });

  test('encode/decode outcome works', () => {
    const outcome = new Outcome({
      view_result_log: ['test', 'nothing'],
      view_result: hexToU8a('0123456789abcdef'),
      outcome_logs: [],
      outcome_receipt_ids: [],
      outcome_gas_burnt: new BN(0x10, 16),
      outcome_token_burnt: new BN(0x100, 16),
      outcome_executor_id: 'alice',
      outcome_status: hexToU8a('0123456789abcdef')
    });

    const buf = buildOutcome(outcome);
    const parsedOutcome = parseOutcome(buf);

    expect(parsedOutcome.view_result_log).toEqual(outcome.view_result_log);
    expect(u8aToHex(parsedOutcome.view_result)).toEqual(u8aToHex(outcome.view_result));
    expect(parsedOutcome.outcome_logs).toEqual(outcome.outcome_logs);
    expect(parsedOutcome.outcome_receipt_ids).toEqual(outcome.outcome_receipt_ids);
    expect(parsedOutcome.outcome_gas_burnt.toNumber()).toEqual(outcome.outcome_gas_burnt.toNumber());
    expect(parsedOutcome.outcome_token_burnt.toNumber()).toEqual(outcome.outcome_token_burnt.toNumber());
    expect(parsedOutcome.outcome_executor_id).toEqual(outcome.outcome_executor_id);
    expect(u8aToHex(parsedOutcome.outcome_status)).toEqual(u8aToHex(outcome.outcome_status));
  });
});
