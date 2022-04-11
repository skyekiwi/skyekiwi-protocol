// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';

import { hexToU8a, u8aToHex } from '@skyekiwi/util';

import { Block, BlockSummary, buildBlock, buildBlockSummary, buildCall, buildCalls, buildContract, buildExecutionSummary, buildLocalMetadata, buildOutcome, buildOutcomes, buildRawOutcomes, buildShard, buildShardMetadata, Call, Calls, Contract, ExecutionSummary, LocalMetadata, Outcome, Outcomes, parseBlock,
  parseBlockSummary, parseCall,
  parseCalls,
  parseContract,
  parseExecutionSummary,
  parseLocalMetadata,
  parseOutcome,
  parseOutcomes,
  parseRawOutcomes,
  parseShard,
  parseShardMetadata,
  RawOutcomes,
  Shard, ShardMetadata } from './borsh';

/* eslint-disable sort-keys, camelcase */
describe('@skyekiwi/s-contract/borsh', function () {
  test('encode/decode calls works', () => {
    const call = new Call({
      origin: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      origin_public_key: hexToU8a('0123456789012345678901234567891201234567890123456789012345678912'),
      encrypted_egress: false,

      transaction_action: 'create_account',
      receiver: 'test',
      amount: 10,
      wasm_blob_path: '/fakepath/wasm_blob.wasm',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const buf = buildCall(call);
    const parsedCall = parseCall(buf);

    expect(parsedCall.origin).toEqual(call.origin);
    expect(u8aToHex(parsedCall.origin_public_key)).toEqual(u8aToHex(call.origin_public_key));
    expect(parsedCall.encrypted_egress).toEqual(call.encrypted_egress);

    expect(parsedCall.transaction_action).toEqual(call.transaction_action);
    expect(parsedCall.receiver).toEqual(call.receiver);
    expect(parsedCall.amount).toEqual(call.amount);
    expect(parsedCall.wasm_blob_path).toEqual(call.wasm_blob_path);
    expect(parsedCall.method).toEqual(call.method);
    expect(parsedCall.args).toEqual(call.args);
    expect(parsedCall.to).toEqual(call.to);
  });

  test('encode/decode batch calls works', () => {
    const call1 = new Call({
      origin: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      origin_public_key: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      encrypted_egress: false,

      transaction_action: 'create_account',
      receiver: 'test',
      amount: 100,
      wasm_blob_path: '/fakepath/wasm_blob.wasm',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const call2 = new Call({
      origin: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      origin_public_key: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      encrypted_egress: false,

      transaction_action: 'create_account',
      receiver: 'test2',
      amount: 10,
      wasm_blob_path: '/fakepath/wasm_blob.wasm',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const calls = new Calls({
      ops: [call1, call2]
    });

    const buf = buildCalls(calls);
    const parsedCalls = parseCalls(buf);

    expect(parsedCalls.ops[0].origin).toEqual(calls.ops[0].origin);
    expect(u8aToHex(parsedCalls.ops[0].origin_public_key)).toEqual(u8aToHex(calls.ops[0].origin_public_key));
    expect(parsedCalls.ops[0].encrypted_egress).toEqual(calls.ops[0].encrypted_egress);

    expect(parsedCalls.ops[0].transaction_action).toEqual(calls.ops[0].transaction_action);
    expect(parsedCalls.ops[0].receiver).toEqual(calls.ops[0].receiver);
    expect(parsedCalls.ops[0].amount).toEqual(calls.ops[0].amount);
    expect(parsedCalls.ops[0].wasm_blob_path).toEqual(calls.ops[0].wasm_blob_path);
    expect(parsedCalls.ops[0].method).toEqual(calls.ops[0].method);
    expect(parsedCalls.ops[0].args).toEqual(calls.ops[0].args);
    expect(parsedCalls.ops[0].to).toEqual(calls.ops[0].to);

    expect(parsedCalls.ops[1].origin).toEqual(calls.ops[1].origin);
    expect(u8aToHex(parsedCalls.ops[1].origin_public_key)).toEqual(u8aToHex(calls.ops[1].origin_public_key));
    expect(parsedCalls.ops[1].encrypted_egress).toEqual(calls.ops[1].encrypted_egress);

    expect(parsedCalls.ops[1].transaction_action).toEqual(calls.ops[1].transaction_action);
    expect(parsedCalls.ops[1].receiver).toEqual(calls.ops[1].receiver);
    expect(parsedCalls.ops[1].amount).toEqual(calls.ops[1].amount);
    expect(parsedCalls.ops[1].wasm_blob_path).toEqual(calls.ops[1].wasm_blob_path);
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

    const outcomes = new RawOutcomes({
      ops: [outcome1, outcome2],
      state_root: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      state_patch: new Uint8Array([1, 2, 3, 4, 5, 6])
    });
    const buf = buildRawOutcomes(outcomes);
    const parsedOutcomes = parseRawOutcomes(buf);

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
    expect(u8aToHex(parsedOutcomes.state_patch)).toEqual(u8aToHex(outcomes.state_patch));
  });

  test('encode/decode block works', () => {
    const block = new Block({
      shard_id: 0,
      block_number: 1,
      calls: [1, 2, 3],
      contracts: ['status']
    });

    const buf = buildBlock(block);
    const parsedBlock = parseBlock(buf);

    expect(parsedBlock).toEqual({
      shard_id: 0,
      block_number: 1,
      calls: [1, 2, 3],
      contracts: ['status']
    });
  });

  test('encode/decode contract works', () => {
    const call = new Call({
      origin: 'deployer',
      origin_public_key: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      encrypted_egress: false,

      transaction_action: 'deploy',
      receiver: 'status',
      amount: 100,
      wasm_blob_path: '/fakepath/wasm_blob.wasm',
      method: undefined,
      args: undefined,
      to: undefined
    });

    const calls = new Calls({
      ops: [call]
    });

    const contract = new Contract({
      home_shard: 0,
      wasm_blob: '/fakepath/wasm_blob.wasm',
      deployment_call: calls,
      deployment_call_index: 12
    });

    const buf = buildContract(contract);
    const parsedContract = parseContract(buf);

    expect(parsedContract.home_shard).toEqual(contract.home_shard);
    expect(parsedContract.wasm_blob).toEqual(contract.wasm_blob);
    expect(buildCalls(parsedContract.deployment_call)).toEqual(buildCalls(calls));
    expect(parsedContract.deployment_call_index).toEqual(contract.deployment_call_index);
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
      ops: []
    });

    const buf = buildCalls(calls);
    const parsedCalls = parseCalls(buf);

    expect(buf).toEqual('');
    expect(parsedCalls).toEqual({
      ops: []
    });
  });

  test('encode/decode local metadata works', () => {
    const localMetadata = new LocalMetadata({
      shard_id: [0, 1],
      high_local_block: 1,
      latest_state_root: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    });

    const buf = buildLocalMetadata(localMetadata);
    const parsedLocalMetadata = parseLocalMetadata(buf);

    expect(localMetadata.shard_id).toEqual(parsedLocalMetadata.shard_id);
    expect(localMetadata.high_local_block).toEqual(parsedLocalMetadata.high_local_block);
    expect(u8aToHex(localMetadata.latest_state_root)).toEqual(u8aToHex(parsedLocalMetadata.latest_state_root));
  });

  test('encode/decode execution summary works', () => {
    const executionSummary = new ExecutionSummary({
      high_local_execution_block: 10
    });

    const buf = buildExecutionSummary(executionSummary);
    const parsedExecutionSummary = parseExecutionSummary(buf);

    expect(executionSummary.high_local_execution_block).toEqual(parsedExecutionSummary.high_local_execution_block);
  });

  test('encode/decode block summary works', () => {
    const blockSum = new BlockSummary({
      block_number: 12,
      block_state_root: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    });

    const buf = buildBlockSummary(blockSum);
    const parsedBlockSummary = parseBlockSummary(buf);

    expect(blockSum.block_number).toEqual(parsedBlockSummary.block_number);
    expect(u8aToHex(blockSum.block_state_root)).toEqual(u8aToHex(parsedBlockSummary.block_state_root));
  });
});
