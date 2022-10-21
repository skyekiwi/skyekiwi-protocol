// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { hexToU8a, stringToU8a, u8aToHex, u8aToString } from '@skyekiwi/util';

import { Block, BlockSummary, buildBlock, buildBlockSummary, buildCall, buildCalls, buildExecutionSummary, buildLocalMetadata, buildOutcome, buildOutcomes, buildShard, buildShardMetadata, Call, Calls, ExecutionSummary, LocalMetadata, Outcome, Outcomes, parseBlock,
  parseBlockSummary, parseCall,
  parseCalls,
  parseExecutionSummary,
  parseLocalMetadata,
  parseOutcome,
  parseOutcomes,
  parseShard,
  parseShardMetadata,
  Shard, ShardMetadata } from './borsh';

/* eslint-disable sort-keys, camelcase */
describe('@skyekiwi/s-contract/borsh', function () {
  test('adhoc', () => {
    //    const raw = new Uint8Array([12, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 64, 66, 15, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 16, 94, 105, 63, 188, 171, 146, 189, 67, 163, 237, 82, 61, 28, 214, 130, 146, 136, 1, 76, 142, 110, 185, 66, 195, 111, 66, 61, 114, 10, 211, 30, 0, 4, 1, 1, 0, 0, 0, 1, 90, 0, 0, 0, 47, 85, 115, 101, 114, 115, 47, 115, 111, 110, 103, 122, 104, 111, 117, 47, 68, 101, 115, 107, 116, 111, 112, 47, 115, 107, 121, 101, 107, 105, 119, 105, 45, 110, 101, 116, 119, 111, 114, 107, 47, 109, 111, 99, 107, 45, 101, 110, 99, 108, 97, 118, 101, 47, 119, 97, 115, 109, 47, 115, 116, 97, 116, 117, 115, 95, 109, 101, 115, 115, 97, 103, 101, 95, 99, 111, 108, 108, 101, 99, 116, 105, 111, 110, 115, 46, 119, 97, 115, 109, 0, 0, 0, 0, 0, 0, 0,]);
    // const raw = hexToU8a('010000006d6f646c73636f6e747261630000000000000000000000000000000000000000d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d000001e8030000000000000000000139000000');

    // const b = baseEncode(raw);
    // const c = parseCalls(b);

    // const sender = new Uint8Array(c.ops[0].origin_public_key);
    // const receiver = new Uint8Array(c.ops[0].receipt_public_key);

    // expect(encodeAddress(sender)).toEqual('5EYCAe5jKbSe4DzkVVriG3QW13WG4j9gy4zmUxjqT8czBuyu');
    // expect(encodeAddress(receiver)).toEqual('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
    // expect(JSON.stringify(c)).toEqual(
    //   '{"ops":[{"origin_public_key":[109,111,100,108,115,99,111,110,116,114,97,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"receipt_public_key":[212,53,147,199,21,253,211,28,97,20,26,189,4,169,159,214,130,44,133,88,133,76,205,227,154,86,132,231,165,109,162,125],"encrypted_egress":false,"transaction_action":0,"amount":1000}],"shard_id":0,"block_number":57}'
    // );
    // console.log(encodeAddress(sender), encodeAddress(receiver));
    // console.log(JSON.stringify(c));
  });

  test('encode/decode calls works', () => {
    const call = new Call({
      origin_public_key: hexToU8a('0123456789012345678901234567891201234567890123456789012345678912'),
      receipt_public_key: hexToU8a('0123456789012345678901234567891201234567890123456789012345678912'),
      encrypted_egress: false,

      transaction_action: 1,
      amount: 10,
      contract_name: stringToU8a('some_contract'),
      method: undefined,
      args: undefined,
      wasm_code: new Uint8Array(10000)
    });

    const buf = buildCall(call);
    const parsedCall = parseCall(buf);

    expect(u8aToHex(parsedCall.origin_public_key)).toEqual(u8aToHex(call.origin_public_key));
    expect(u8aToHex(parsedCall.receipt_public_key)).toEqual(u8aToHex(call.receipt_public_key));
    expect(parsedCall.encrypted_egress).toEqual(call.encrypted_egress);

    expect(parsedCall.transaction_action).toEqual(call.transaction_action);

    expect(parsedCall.amount).toEqual(call.amount);
    expect(u8aToString(
      new Uint8Array(parsedCall.contract_name))).toEqual(u8aToString(
      new Uint8Array(call.contract_name)));
    expect(parsedCall.method).toEqual(call.method);
    expect(parsedCall.args).toEqual(call.args);
    expect(u8aToHex(parsedCall.wasm_code)).toEqual(u8aToHex(call.wasm_code));
  });

  test('encode/decode batch calls works', () => {
    const call1 = new Call({
      origin_public_key: hexToU8a('0123456789012345678901234567891201234567890123456789012345678912'),
      receipt_public_key: hexToU8a('0123456789012345678901234567891201234567890123456789012345678912'),
      encrypted_egress: false,

      transaction_action: 1,

      amount: 100,
      contract_name: stringToU8a('some_contract'),
      method: undefined,
      args: undefined,
      wasm_code: new Uint8Array(10000)
    });

    const call2 = new Call({
      origin_public_key: hexToU8a('0123456789012345678901234567891201234567890123456789012345678912'),
      receipt_public_key: hexToU8a('0123456789012345678901234567891201234567890123456789012345678912'),
      encrypted_egress: false,

      transaction_action: 1,

      amount: 100,
      contract_name: undefined,
      method: stringToU8a('some_method'),
      args: undefined,
      wasm_code: undefined
    });

    const calls = new Calls({
      ops: [call1, call2],
      shard_id: 0,
      block_number: 10
    });

    const buf = buildCalls(calls);
    const parsedCalls = parseCalls(buf);

    expect(u8aToHex(parsedCalls.ops[0].origin_public_key)).toEqual(u8aToHex(calls.ops[0].origin_public_key));
    expect(u8aToHex(parsedCalls.ops[0].receipt_public_key)).toEqual(u8aToHex(calls.ops[0].receipt_public_key));
    expect(parsedCalls.ops[0].encrypted_egress).toEqual(calls.ops[0].encrypted_egress);

    expect(parsedCalls.ops[0].transaction_action).toEqual(calls.ops[0].transaction_action);
    expect(parsedCalls.ops[0].amount).toEqual(calls.ops[0].amount);
    expect(u8aToString(
      new Uint8Array(new Uint8Array(parsedCalls.ops[0].contract_name))))
      .toEqual(u8aToString(
        new Uint8Array(new Uint8Array(calls.ops[0].contract_name))));
    expect(parsedCalls.ops[0].method).toEqual(undefined);
    expect(parsedCalls.ops[0].args).toEqual(undefined);
    expect(u8aToHex(parsedCalls.ops[0].wasm_code)).toEqual(u8aToHex(calls.ops[0].wasm_code));

    expect(u8aToHex(parsedCalls.ops[1].origin_public_key)).toEqual(u8aToHex(calls.ops[1].origin_public_key));
    expect(u8aToHex(parsedCalls.ops[1].receipt_public_key)).toEqual(u8aToHex(calls.ops[1].receipt_public_key));
    expect(parsedCalls.ops[1].encrypted_egress).toEqual(calls.ops[1].encrypted_egress);

    expect(parsedCalls.ops[1].transaction_action).toEqual(calls.ops[1].transaction_action);
    expect(parsedCalls.ops[1].amount).toEqual(calls.ops[1].amount);
    expect(parsedCalls.ops[1].contract_name).toEqual(undefined);
    expect(u8aToString(
      new Uint8Array(parsedCalls.ops[1].method))).toEqual(u8aToString(
      new Uint8Array(calls.ops[1].method)));
    expect(parsedCalls.ops[1].args).toEqual(undefined);
    expect(parsedCalls.ops[1].wasm_code).toBeUndefined();
  });

  test('encode/decode outcome works', () => {
    const outcome = new Outcome({
      view_result_log: [stringToU8a('test')],
      view_result: hexToU8a('0123456789abcdef'),
      view_error: undefined,

      outcome_logs: [],
      outcome_token_burnt: 10,
      outcome_status: hexToU8a('0123456789abcdef')
    });

    const buf = buildOutcome(outcome);
    const parsedOutcome = parseOutcome(buf);

    expect(u8aToString(
      new Uint8Array(parsedOutcome.view_result_log[0])))
      .toEqual(u8aToString(
        new Uint8Array(outcome.view_result_log[0])));
    expect(u8aToHex(parsedOutcome.view_result)).toEqual(u8aToHex(outcome.view_result));
    expect(parsedOutcome.outcome_logs).toEqual(outcome.outcome_logs);
    expect(parsedOutcome.outcome_token_burnt).toEqual(outcome.outcome_token_burnt);
    expect(u8aToHex(parsedOutcome.outcome_status)).toEqual(u8aToHex(outcome.outcome_status));
  });

  test('encode/decode batch outcome works', () => {
    const outcome1 = new Outcome({
      view_result_log: [stringToU8a('test')],
      view_result: hexToU8a('0123456789abcdef'),
      view_error: undefined,

      outcome_logs: [],
      outcome_token_burnt: 10,
      outcome_status: hexToU8a('0123456789abcdef')
    });

    const outcome2 = new Outcome({
      view_result_log: [stringToU8a('test')],
      view_result: hexToU8a('0123456789abcdef'),
      view_error: undefined,

      outcome_logs: [],
      outcome_token_burnt: 10,
      outcome_status: hexToU8a('0123456789abcdef')
    });

    const outcomes = new Outcomes({
      ops: [outcome1, outcome2],
      call_id: 1,
      signature: new Uint8Array(64),
      state_root: new Uint8Array(32)
    });
    const buf = buildOutcomes(outcomes);
    const parsedOutcomes = parseOutcomes(buf);

    expect(u8aToString(
      new Uint8Array(parsedOutcomes.ops[0].view_result_log[0])))
      .toEqual(u8aToString(
        new Uint8Array(outcomes.ops[0].view_result_log[0])));
    expect(u8aToHex(parsedOutcomes.ops[0].view_result)).toEqual(u8aToHex(outcomes.ops[0].view_result));
    expect(parsedOutcomes.ops[0].outcome_logs).toEqual(outcomes.ops[0].outcome_logs);
    expect(parsedOutcomes.ops[0].outcome_token_burnt).toEqual(outcomes.ops[0].outcome_token_burnt);
    expect(u8aToHex(parsedOutcomes.ops[0].outcome_status)).toEqual(u8aToHex(outcomes.ops[0].outcome_status));

    expect(u8aToHex(parsedOutcomes.ops[1].view_result_log[0])).toEqual(u8aToHex(outcomes.ops[1].view_result_log[0]));
    expect(u8aToHex(parsedOutcomes.ops[1].view_result)).toEqual(u8aToHex(outcomes.ops[1].view_result));
    expect(parsedOutcomes.ops[1].outcome_logs).toEqual(outcomes.ops[1].outcome_logs);
    expect(parsedOutcomes.ops[1].outcome_token_burnt).toEqual(outcomes.ops[1].outcome_token_burnt);
    expect(u8aToHex(parsedOutcomes.ops[1].outcome_status)).toEqual(u8aToHex(outcomes.ops[1].outcome_status));

    expect(u8aToHex(parsedOutcomes.state_root)).toEqual(u8aToHex(outcomes.state_root));
    expect(parsedOutcomes.call_id).toEqual(1);
    expect(parsedOutcomes.signature.length).toEqual(64);
    expect(u8aToHex(parsedOutcomes.signature)).toEqual(u8aToHex(new Uint8Array(64)));
  });

  test('encode/decode block works', () => {
    const block = new Block({
      shard_id: 0,
      block_number: 1,
      calls: [1, 2, 3]
    });

    const buf = buildBlock(block);
    const parsedBlock = parseBlock(buf);

    expect(parsedBlock).toEqual({
      shard_id: 0,
      block_number: 1,
      calls: [1, 2, 3]
    });
  });

  test('encode/decode shard works', () => {
    const shardMetadata = new ShardMetadata({
      shard_key: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      shard_members: ['0x1', '0x2', '0x3'],
      beacon_index: 1,
      threshold: 1
    });
    const shard = new Shard({
      high_remote_synced_block_index: 1,
      high_remote_confirmed_block_index: 1
    });

    const buf1 = buildShard(shard);
    const parsedShard = parseShard(buf1);

    const buf2 = buildShardMetadata(shardMetadata);
    const parsedShardMetadata = parseShardMetadata(buf2);

    expect(u8aToHex(parsedShardMetadata.shard_key)).toEqual(u8aToHex(shardMetadata.shard_key));
    expect(parsedShardMetadata.shard_members).toEqual(shardMetadata.shard_members);
    expect(parsedShardMetadata.beacon_index).toEqual(shardMetadata.beacon_index);
    expect(parsedShardMetadata.threshold).toEqual(shardMetadata.threshold);

    expect(parsedShard.high_remote_synced_block_index).toEqual(shard.high_remote_synced_block_index);
    expect(parsedShard.high_remote_confirmed_block_index).toEqual(shard.high_remote_confirmed_block_index);
  });

  test('encode/decode empty calls works', () => {
    const calls = new Calls({
      ops: [],
      shard_id: 0,
      block_number: 10
    });

    const buf = buildCalls(calls);

    const parsedCalls = parseCalls(buf);

    expect(parsedCalls).toEqual({
      ops: [],
      shard_id: 0,
      block_number: 10
    });
  });

  test('encode/decode local metadata works', () => {
    const localMetadata = new LocalMetadata({
      shard_id: [0, 1],
      high_local_block: 1
    });

    const buf = buildLocalMetadata(localMetadata);
    const parsedLocalMetadata = parseLocalMetadata(buf);

    expect(localMetadata.shard_id).toEqual(parsedLocalMetadata.shard_id);
    expect(localMetadata.high_local_block).toEqual(parsedLocalMetadata.high_local_block);
  });

  test('encode/decode execution summary works', () => {
    const executionSummary = new ExecutionSummary({
      high_local_execution_block: 10,
      latest_state_root: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    });

    const buf = buildExecutionSummary(executionSummary);
    const parsedExecutionSummary = parseExecutionSummary(buf);

    expect(executionSummary.high_local_execution_block).toEqual(parsedExecutionSummary.high_local_execution_block);
    expect(u8aToHex(executionSummary.latest_state_root)).toEqual(u8aToHex(parsedExecutionSummary.latest_state_root));
  });

  test('encode/decode block summary works', () => {
    const blockSum = new BlockSummary({
      block_number: 12,
      block_state_root: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      contract_state_patch_from_previous_block: new Uint8Array([1, 2, 3, 4]),
      call_state_patch_from_previous_block: new Uint8Array([1, 2, 3, 4])
    });

    const buf = buildBlockSummary(blockSum);
    const parsedBlockSummary = parseBlockSummary(buf);

    expect(blockSum.block_number).toEqual(parsedBlockSummary.block_number);
    expect(u8aToHex(blockSum.block_state_root)).toEqual(u8aToHex(parsedBlockSummary.block_state_root));
    expect(u8aToHex(blockSum.contract_state_patch_from_previous_block)).toEqual(u8aToHex(parsedBlockSummary.contract_state_patch_from_previous_block));
    expect(u8aToHex(blockSum.call_state_patch_from_previous_block)).toEqual(u8aToHex(parsedBlockSummary.call_state_patch_from_previous_block));
  });
});
