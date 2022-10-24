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

  public encrypted: Uint8Array | null

  constructor (config: {
    view_result_log: Uint8Array[],
    view_result: Uint8Array | null,
    view_error: Uint8Array | null,

    outcome_logs: Uint8Array[],
    outcome_token_burnt: number,
    outcome_status: Uint8Array | null,

    encrypted: Uint8Array | null,
  }) {
    this.view_result_log = config.view_result_log;
    this.view_result = config.view_result;
    this.view_error = config.view_error;

    this.outcome_logs = config.outcome_logs;
    this.outcome_token_burnt = config.outcome_token_burnt;
    this.outcome_status = config.outcome_status;

    this.encrypted = config.encrypted;
  }
}

class Outcomes {
  public ops: Outcome[]
  public call_index: number
  public signature: Uint8Array
  public state_root: Uint8Array

  constructor (config: {
    ops: Outcome[],
    call_index: number,
    signature: Uint8Array,
    state_root: Uint8Array,
  }) {
    this.ops = config.ops;
    this.call_index = config.call_index;
    this.signature = config.signature;
    this.state_root = config.state_root;
  }
}

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
      ['wasm_code', { kind: 'option', type: ['u8'] }]
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
    ['outcome_status', { kind: 'option', type: ['u8'] }],

    ['encrypted', { kind: 'option', type: ['u8'] }]
  ]
}]]);
const outcomesSchema = new Map();

outcomesSchema.set(Outcomes, {
  kind: 'struct',
  fields: [
    ['ops', [Outcome]],
    ['call_index', 'u32'],
    ['signature', ['u8']],
    ['state_root', ['u8', 32]]
  ]
});
outcomesSchema.set(Outcome, outcomeSchema.get(Outcome));

// ser
const buildCall = (
  call: Call
): Uint8Array => {
  return serialize(callSchema, call);
};

const buildCalls = (
  calls: Calls
): Uint8Array => {
  return serialize(callsSchema, calls);
};

const buildOutcome = (
  outcome: Outcome
): Uint8Array => {
  return serialize(outcomeSchema, outcome);
};

const buildOutcomes = (
  outcomes: Outcomes
): Uint8Array => {
  return serialize(outcomesSchema, outcomes);
};

// de
const parseCall = (
  buf: Uint8Array
): Call => {
  const c = deserialize(callSchema, Call, Buffer.from(buf));

  c.encrypted_egress = !!c.encrypted_egress;

  // c.origin_public_key = new Uint8Array(c.origin_public_key);
  // c.receipt_public_key = new Uint8Array(c.receipt_public_key);
  // c.contract_name = new Uint8Array(c.contract_name);
  // c.method = new Uint8Array(c.method);
  // c.args = new Uint8Array(c.args);
  // c.wasm_code = new Uint8Array(c.wasm_code);
  return c;
};

const parseCalls = (
  buf: Uint8Array
): Calls => {
  const cs = deserialize(callsSchema, Calls, Buffer.from(buf));

  for (let i = 0; i < cs.ops.length; i++) {
    cs.ops[i].encrypted_egress = !!cs.ops[i].encrypted_egress;
  }

  return cs;
};

const parseOutcome = (
  buf: Uint8Array
): Outcome => {
  const o = deserialize(outcomeSchema, Outcome, Buffer.from(buf));

  return o;
};

const parseOutcomes = (
  buf: Uint8Array
): Outcomes => {
  return deserialize(outcomesSchema, Outcomes, Buffer.from(buf));
};

export {
  Call, callSchema, buildCall, parseCall,
  Calls, callsSchema, buildCalls, parseCalls,
  Outcome, outcomeSchema, buildOutcome, parseOutcome,
  Outcomes, outcomesSchema, buildOutcomes, parseOutcomes,

  baseEncode, baseDecode
};
