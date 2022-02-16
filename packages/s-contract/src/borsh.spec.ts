// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';

import { hexToU8a, u8aToHex } from '@skyekiwi/util';

import { buildCall, buildCalls, buildOutcome, buildOutcomes,
  Call, Calls, Outcome, Outcomes,
  parseCall, parseCalls, parseOutcome, parseOutcomes } from './borsh';

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

    expect(parsedCall.transaction_action).toEqual(call.transaction_action);
    expect(parsedCall.receiver).toEqual(call.receiver);
    expect(parsedCall.amount.toNumber()).toEqual(call.amount.toNumber());
    expect(parsedCall.wasm_file).toEqual(call.wasm_file);
    expect(parsedCall.method).toEqual(call.method);
    expect(parsedCall.args).toEqual(call.args);
    expect(parsedCall.to).toEqual(call.to);
  });

  test('encode/decode batch calls works', () => {
    const call1 = new Call({
      transaction_action: 'create_account',
      receiver: 'test',
      amount: new BN(0x100, 16),
      wasm_file: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const call2 = new Call({
      transaction_action: 'create_account',
      receiver: 'test2',
      amount: new BN(0x100, 16),
      wasm_file: 'QmZMpQ8K7Tp1Uwae8SXi3ZJqJDES8JGBiMmNWV2iRatwbW',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const calls = new Calls({
      ops: [call1, call2]
    });

    const buf = buildCalls(calls);
    const parsedCalls = parseCalls(buf);

    expect(parsedCalls.ops[0].transaction_action).toEqual(calls.ops[0].transaction_action);
    expect(parsedCalls.ops[0].receiver).toEqual(calls.ops[0].receiver);
    expect(parsedCalls.ops[0].amount.toNumber()).toEqual(calls.ops[0].amount.toNumber());
    expect(parsedCalls.ops[0].wasm_file).toEqual(calls.ops[0].wasm_file);
    expect(parsedCalls.ops[0].method).toEqual(calls.ops[0].method);
    expect(parsedCalls.ops[0].args).toEqual(calls.ops[0].args);
    expect(parsedCalls.ops[0].to).toEqual(calls.ops[0].to);

    expect(parsedCalls.ops[1].transaction_action).toEqual(calls.ops[1].transaction_action);
    expect(parsedCalls.ops[1].receiver).toEqual(calls.ops[1].receiver);
    expect(parsedCalls.ops[1].amount.toNumber()).toEqual(calls.ops[1].amount.toNumber());
    expect(parsedCalls.ops[1].wasm_file).toEqual(calls.ops[1].wasm_file);
    expect(parsedCalls.ops[1].method).toEqual(calls.ops[1].method);
    expect(parsedCalls.ops[1].args).toEqual(calls.ops[1].args);
    expect(parsedCalls.ops[1].to).toEqual(calls.ops[1].to);
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

  test('encode/decode batch outcome works', () => {
    const outcome1 = new Outcome({
      view_result_log: ['test', 'nothing'],
      view_result: hexToU8a('0123456789abcdef'),
      outcome_logs: [],
      outcome_receipt_ids: [],
      outcome_gas_burnt: new BN(0x10, 16),
      outcome_token_burnt: new BN(0x100, 16),
      outcome_executor_id: 'alice',
      outcome_status: hexToU8a('0123456789abcdef')
    });

    const outcome2 = new Outcome({
      view_result_log: ['test', 'nothingelse'],
      view_result: hexToU8a('0123456789abcdef'),
      outcome_logs: [],
      outcome_receipt_ids: [],
      outcome_gas_burnt: new BN(0x10, 16),
      outcome_token_burnt: new BN(0x100, 16),
      outcome_executor_id: 'alice',
      outcome_status: hexToU8a('0123456789abcdef')
    });

    const outcomes = new Outcomes({
      ops: [outcome1, outcome2],
      state_root: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    });
    const buf = buildOutcomes(outcomes);
    const parsedOutcomes = parseOutcomes(buf);

    expect(parsedOutcomes.ops[0].view_result_log).toEqual(outcomes.ops[0].view_result_log);
    expect(u8aToHex(parsedOutcomes.ops[0].view_result)).toEqual(u8aToHex(outcomes.ops[0].view_result));
    expect(parsedOutcomes.ops[0].outcome_logs).toEqual(outcomes.ops[0].outcome_logs);
    expect(parsedOutcomes.ops[0].outcome_receipt_ids).toEqual(outcomes.ops[0].outcome_receipt_ids);
    expect(parsedOutcomes.ops[0].outcome_gas_burnt.toNumber()).toEqual(outcomes.ops[0].outcome_gas_burnt.toNumber());
    expect(parsedOutcomes.ops[0].outcome_token_burnt.toNumber()).toEqual(outcomes.ops[0].outcome_token_burnt.toNumber());
    expect(parsedOutcomes.ops[0].outcome_executor_id).toEqual(outcomes.ops[0].outcome_executor_id);
    expect(u8aToHex(parsedOutcomes.ops[0].outcome_status)).toEqual(u8aToHex(outcomes.ops[0].outcome_status));

    expect(parsedOutcomes.ops[1].view_result_log).toEqual(outcomes.ops[1].view_result_log);
    expect(u8aToHex(parsedOutcomes.ops[1].view_result)).toEqual(u8aToHex(outcomes.ops[1].view_result));
    expect(parsedOutcomes.ops[1].outcome_logs).toEqual(outcomes.ops[1].outcome_logs);
    expect(parsedOutcomes.ops[1].outcome_receipt_ids).toEqual(outcomes.ops[1].outcome_receipt_ids);
    expect(parsedOutcomes.ops[1].outcome_gas_burnt.toNumber()).toEqual(outcomes.ops[1].outcome_gas_burnt.toNumber());
    expect(parsedOutcomes.ops[1].outcome_token_burnt.toNumber()).toEqual(outcomes.ops[1].outcome_token_burnt.toNumber());
    expect(parsedOutcomes.ops[1].outcome_executor_id).toEqual(outcomes.ops[1].outcome_executor_id);
    expect(u8aToHex(parsedOutcomes.ops[1].outcome_status)).toEqual(u8aToHex(outcomes.ops[1].outcome_status));

    expect(u8aToHex(parsedOutcomes.state_root)).toEqual(u8aToHex(outcomes.state_root));
  });
});
