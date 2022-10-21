// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { baseDecode, baseEncode, deserialize, serialize } from 'borsh';

/* eslint-disable sort-keys, camelcase */
class Call {
  public origin_public_key: Uint8Array
  public receipt_public_key: Uint8Array
  public encrypted_egress: boolean

  // public transaction_action: 'create_account' | 'call' | 'transfer' | 'view_method_call' | 'deploy'
  public transaction_action: number

  public amount: number | null
  public contract_name: Uint8Array | null
  public method: Uint8Array | null
  public args: Uint8Array | null
  public wasm_code: Uint8Array | null

  constructor (config: {
    origin_public_key: Uint8Array,
    receipt_public_key: Uint8Array,
    encrypted_egress: boolean,

    transaction_action: number,

    amount: number | null,
    contract_name: Uint8Array | null,
    method: Uint8Array | null,
    args: Uint8Array | null,
    wasm_code: Uint8Array | null,
  }) {
    this.origin_public_key = config.origin_public_key;
    this.receipt_public_key = config.receipt_public_key;
    this.encrypted_egress = config.encrypted_egress;

    this.transaction_action = config.transaction_action;

    this.amount = config.amount;
    this.contract_name = config.contract_name;
    this.method = config.method;
    this.args = config.args;
    this.wasm_code = config.wasm_code;
  }
}

class Calls {
  public ops: Call[]
  public shard_id: number
  public block_number: number | null

  constructor (config: {
    ops: Call[],
    shard_id: number,
    block_number: number | null,
  }) {
    this.ops = config.ops;
    this.shard_id = config.shard_id;
    this.block_number = config.block_number;
  }
}
class Outcome {
  public view_result_log: Uint8Array[]
  public view_result: Uint8Array | null
  public view_error: Uint8Array | null

  public outcome_logs: Uint8Array[]
  public outcome_token_burnt: number
  public outcome_status: Uint8Array | null

  constructor (config: {
    view_result_log: Uint8Array[],
    view_result: Uint8Array | null,
    view_error: Uint8Array | null,

    outcome_logs: Uint8Array[],
    outcome_token_burnt: number,
    outcome_status: Uint8Array | null,
  }) {
    this.view_result_log = config.view_result_log;
    this.view_result = config.view_result;
    this.view_error = config.view_error;

    this.outcome_logs = config.outcome_logs;
    this.outcome_token_burnt = config.outcome_token_burnt;
    this.outcome_status = config.outcome_status;
  }
}

class Outcomes {
  public ops: Outcome[]
  public call_ids: number[]
  public signatures: Uint8Array[]
  public state_root: Uint8Array

  constructor (config: {
    ops: Outcome[],
    call_ids: number[],
    signatures: Uint8Array[],
    state_root: Uint8Array,
  }) {
    this.ops = config.ops;
    this.call_ids = config.call_ids;
    this.signatures = config.signatures;
    this.state_root = config.state_root;
  }
}

class LocalMetadata {
  public shard_id: number[]
  public high_local_block: number

  constructor (config: {
    shard_id: number[],
    high_local_block: number,
  }) {
    this.shard_id = config.shard_id;
    this.high_local_block = config.high_local_block;
  }
}

class Block {
  public shard_id: number
  public block_number: number
  public calls: number[]

  constructor (config: {
    shard_id: number,
    block_number: number,
    calls: number[],
  }) {
    this.shard_id = config.shard_id;
    this.block_number = config.block_number;
    this.calls = config.calls;
  }
}

class Shard {
  public high_remote_synced_block_index: number
  public high_remote_confirmed_block_index: number

  constructor (config: {
    high_remote_synced_block_index: number,
    high_remote_confirmed_block_index: number,
  }) {
    this.high_remote_synced_block_index = config.high_remote_synced_block_index;
    this.high_remote_confirmed_block_index = config.high_remote_confirmed_block_index;
  }
}

class ShardMetadata {
  public shard_key: Uint8Array
  public shard_members: string[]
  public beacon_index: number
  public threshold: number

  constructor (config: {
    shard_key: Uint8Array,
    shard_members: string[],
    beacon_index: number,
    threshold: number,
  }) {
    this.shard_key = config.shard_key;
    this.shard_members = config.shard_members;
    this.beacon_index = config.beacon_index;
    this.threshold = config.threshold;
  }
}

class ExecutionSummary {
  public high_local_execution_block: number
  public latest_state_root: Uint8Array

  constructor (config: {
    high_local_execution_block: number,
    latest_state_root: Uint8Array,
  }) {
    this.high_local_execution_block = config.high_local_execution_block;
    this.latest_state_root = config.latest_state_root;
  }
}

class BlockSummary {
  public block_number: number
  public block_state_root: Uint8Array
  public contract_state_patch_from_previous_block: Uint8Array
  public call_state_patch_from_previous_block: Uint8Array

  constructor (config: {
    block_number: number,
    block_state_root: Uint8Array,
    contract_state_patch_from_previous_block: Uint8Array,
    call_state_patch_from_previous_block: Uint8Array,
  }) {
    this.block_number = config.block_number;
    this.block_state_root = config.block_state_root;
    this.contract_state_patch_from_previous_block = config.contract_state_patch_from_previous_block;
    this.call_state_patch_from_previous_block = config.call_state_patch_from_previous_block;
  }
}

const blockSummarySchema = new Map([
  [BlockSummary, {
    kind: 'struct',
    fields: [
      ['block_number', 'u32'],
      ['block_state_root', ['u8', 32]],
      ['contract_state_patch_from_previous_block', ['u8']],
      ['call_state_patch_from_previous_block', ['u8']]
    ]
  }]
]);

const blockSchema = new Map([
  [Block, {
    kind: 'struct',
    fields: [
      ['shard_id', 'u32'],
      ['block_number', 'u32'],
      ['calls', { kind: 'option', type: ['u32'] }]
    ]
  }]
]);

const callSchema = new Map([
  [Call, {
    kind: 'struct',
    fields: [
      ['origin_public_key', ['u8', 32]],
      ['receipt_public_key', ['u8', 32]],
      ['encrypted_egress', 'u8'],

      ['transaction_action', 'u8'],

      ['amount', { kind: 'option', type: 'u32' }],
      ['contract_name', { kind: 'option', type: ['u8'] }],
      ['method', { kind: 'option', type: ['u8'] }],
      ['args', { kind: 'option', type: ['u8'] }],
      ['wasm_code', {kind: 'option', type: ['u8']}],
    ]
  }]
]);
const callsSchema = new Map();

callsSchema.set(Calls, {
  kind: 'struct',
  fields: [
    ['ops', [Call]],
    ['shard_id', 'u32'],
    ['block_number', { kind: 'option', type: 'u32' }]
  ]
});
callsSchema.set(Call, callSchema.get(Call));

const outcomeSchema = new Map([[Outcome, {
  kind: 'struct',
  fields: [
    ['view_result_log', [['u8']]],
    ['view_result', { kind: 'option', type: ['u8'] }],
    ['view_error', { kind: 'option', type: ['u8'] }],

    ['outcome_logs', [['u8']]],
    ['outcome_token_burnt', 'u32'],
    ['outcome_status', { kind: 'option', type: ['u8'] }]
  ]
}]]);
const outcomesSchema = new Map();

outcomesSchema.set(Outcomes, {
  kind: 'struct',
  fields: [
    ['ops', [Outcome]],
    ['call_ids', ['u32']],
    ['signatures', [['u8']]],
    ['state_root', ['u8', 32]]
  ]
});
outcomesSchema.set(Outcome, outcomeSchema.get(Outcome));

const shardMetadataSchema = new Map([
  [ShardMetadata, {
    kind: 'struct',
    fields: [
      ['shard_key', ['u8', 32]],
      ['shard_members', ['string']],
      ['beacon_index', 'u32'],
      ['threshold', 'u32']
    ]
  }]
]);
const shardSchema = new Map([
  [Shard, {
    kind: 'struct',
    fields: [
      ['high_remote_synced_block_index', 'u32'],
      ['high_remote_confirmed_block_index', 'u32']
    ]
  }]
]);
const localMetadataSchema = new Map([
  [LocalMetadata, {
    kind: 'struct',
    fields: [
      ['shard_id', ['u32']],
      ['high_local_block', 'u32']
    ]
  }]
]);
const executionSummarySchema = new Map([
  [ExecutionSummary, {
    kind: 'struct',
    fields: [
      ['high_local_execution_block', 'u32'],
      ['latest_state_root', ['u8', 32]]
    ]
  }]
]);

// ser
const buildCall = (
  call: Call
): string => {
  const buf = serialize(callSchema, call);

  return baseEncode(buf);
};

const buildBlock = (
  block: Block
): string => {
  const buf = serialize(blockSchema, block);

  return baseEncode(buf);
};

const buildCalls = (
  calls: Calls
): string => {
  const buf = serialize(callsSchema, calls);

  return baseEncode(buf);
};

const buildOutcome = (
  outcome: Outcome
): string => {
  const buf = serialize(outcomeSchema, outcome);

  return baseEncode(buf);
};

const buildOutcomes = (
  outcomes: Outcomes
): string => {
  const buf = serialize(outcomesSchema, outcomes);

  return baseEncode(buf);
};

const buildShard = (
  shard: Shard
): string => {
  const buf = serialize(shardSchema, shard);

  return baseEncode(buf);
};

const buildShardMetadata = (
  shardMetadata: ShardMetadata
): string => {
  const buf = serialize(shardMetadataSchema, shardMetadata);

  return baseEncode(buf);
};

const buildLocalMetadata = (a: LocalMetadata): string => {
  const buf = serialize(localMetadataSchema, a);

  return baseEncode(buf);
};

const buildExecutionSummary = (a: ExecutionSummary): string => {
  const buf = serialize(executionSummarySchema, a);

  return baseEncode(buf);
};

const buildBlockSummary = (a: BlockSummary): string => {
  const buf = serialize(blockSummarySchema, a);

  return baseEncode(buf);
};

// de
const parseCall = (
  buf: string
): Call => {
  const c = deserialize(callSchema, Call, baseDecode(buf));

  c.encrypted_egress = !!c.encrypted_egress;

  return c;
};

const parseCalls = (
  buf: string
): Calls => {
  const cs = deserialize(callsSchema, Calls, baseDecode(buf));

  for (let i = 0; i < cs.ops.length; i++) {
    cs.ops[i].encrypted_egress = !!cs.ops[i].encrypted_egress;
  }

  return cs;
};

const parseOutcome = (
  buf: string
): Outcome => {
  return deserialize(outcomeSchema, Outcome, baseDecode(buf));
};

const parseOutcomes = (
  buf: string
): Outcomes => {
  return deserialize(outcomesSchema, Outcomes, baseDecode(buf));
};

const parseBlock = (
  buf: string
): Block => {
  return deserialize(blockSchema, Block, baseDecode(buf));
};

const parseShard = (
  buf: string
): Shard => {
  return deserialize(shardSchema, Shard, baseDecode(buf));
};

const parseShardMetadata = (
  buf: string
): ShardMetadata => {
  return deserialize(shardMetadataSchema, ShardMetadata, baseDecode(buf));
};

const parseLocalMetadata = (buf: string): LocalMetadata => {
  return deserialize(localMetadataSchema, LocalMetadata, baseDecode(buf));
};

const parseExecutionSummary = (
  buf: string
): ExecutionSummary => {
  return deserialize(executionSummarySchema, ExecutionSummary, baseDecode(buf));
};

const parseBlockSummary = (
  buf: string
): BlockSummary => {
  return deserialize(blockSummarySchema, BlockSummary, baseDecode(buf));
};

export {
  Call, callSchema, buildCall, parseCall,
  Calls, callsSchema, buildCalls, parseCalls,
  Outcome, outcomeSchema, buildOutcome, parseOutcome,
  Outcomes, outcomesSchema, buildOutcomes, parseOutcomes,
  Block, blockSchema, buildBlock, parseBlock,
  Shard, shardSchema, buildShard, parseShard,
  ShardMetadata, shardMetadataSchema, buildShardMetadata, parseShardMetadata,
  LocalMetadata, localMetadataSchema, buildLocalMetadata, parseLocalMetadata,
  ExecutionSummary, executionSummarySchema, buildExecutionSummary, parseExecutionSummary,
  BlockSummary, blockSummarySchema, buildBlockSummary, parseBlockSummary,

  baseEncode, baseDecode
};
