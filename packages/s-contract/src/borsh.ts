// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import { deserialize, serialize } from 'borsh';

/* eslint-disable sort-keys, camelcase */
class WrappedCall {
  public call: Uint8Array

  public callIndex: string
  public contractId: string
  public encrypted: boolean
  public origin: string
  public originPublicKey: Uint8Array
  public shardId: number

  constructor (config: {
    call: Uint8Array,

    callIndex: string,
    contractId: string,
    encrypted: boolean,
    origin: string,
    shardId: number
  }) {
    this.call = config.call;
    this.callIndex = config.callIndex;
    this.contractId = config.contractId;
    this.encrypted = config.encrypted;
    this.origin = config.origin;
    this.shardId = config.shardId;
  }
}

class Call {
  public transaction_action: 'create_account' | 'call' | 'transfer' | 'view_method_call' | 'deploy'
  public receiver: string
  public amount: BN | null
  public wasm_file: string | null
  public method: string | null
  public args: string | null
  public to: string | null

  constructor (config: {
    transaction_action: 'create_account' | 'call' | 'transfer' | 'view_method_call' | 'deploy',
    receiver: string,
    amount: BN | null,
    wasm_file: string | null,
    method: string | null,
    args: string | null,
    to: string | null,
  }) {
    this.transaction_action = config.transaction_action;
    this.receiver = config.receiver;
    this.amount = config.amount;
    this.wasm_file = config.wasm_file;
    this.method = config.method;
    this.args = config.args;
    this.to = config.to;
  }
}

const callSchema = new Map([
  [Call, {
    kind: 'struct',
    fields: [
      ['transactionAction', 'string'],
      ['receiver', 'string'],
      ['amount', { kind: 'option', type: 'u128' }],
      ['wasm_file', { kind: 'option', type: 'string' }],
      ['method', { kind: 'option', type: 'string' }],
      ['args', { kind: 'option', type: 'string' }],
      ['to', { kind: 'option', type: 'string' }]
    ]
  }]
]);

class Outcome {
  public view_result_log: string[]
  public view_result: Uint8Array
  public outcome_logs: string[]
  public outcome_receipt_ids: Uint8Array[]
  public outcome_gas_burnt: BN
  public outcome_token_burnt: BN
  public outcome_executor_id: string
  public outcome_status: Uint8Array | null

  constructor (config: {
    view_result_log: string[],
    view_result: Uint8Array,
    outcome_logs: string[],
    outcome_receipt_ids: Uint8Array[],
    outcome_gas_burnt: BN,
    outcome_token_burnt: BN,
    outcome_executor_id: string,
    outcome_status: Uint8Array | null,
  }) {
    this.view_result_log = config.view_result_log;
    this.view_result = config.view_result;
    this.outcome_logs = config.outcome_logs;
    this.outcome_receipt_ids = config.outcome_receipt_ids;
    this.outcome_gas_burnt = config.outcome_gas_burnt;
    this.outcome_token_burnt = config.outcome_token_burnt;
    this.outcome_executor_id = config.outcome_executor_id;
    this.outcome_status = config.outcome_status;
  }
}

class WrappedOutcome {
  public outcome: Uint8Array

  public callIndex: string
  public contractId: string
  public encrypted: boolean
  public origin: string
  public shardId: number

  constructor (config: {
    outcome: Uint8Array,

    callIndex: string,
    contractId: string,
    encrypted: boolean,
    origin: string,
    shardId: number
  }) {
    this.outcome = config.outcome;
    this.callIndex = config.callIndex;
    this.contractId = config.contractId;
    this.encrypted = config.encrypted;
    this.origin = config.origin;
    this.shardId = config.shardId;
  }
}

const outcomeSchema = new Map([[Outcome, {
  kind: 'struct',
  fields: [
    ['view_result_log', ['string']],
    ['view_result', ['u8']],
    ['outcome_logs', ['string']],
    ['outcome_receipt_ids', [['u8', 32]]],
    ['outcome_gas_burnt', 'u64'],
    ['outcome_token_burnt', 'u128'],
    ['outcome_executor_id', 'String'],
    ['outcome_status', { kind: 'option', type: ['u8'] }]
  ]
}]]);

const buildCall = (
  call: Call
): Uint8Array => {
  const buf = serialize(callSchema, call);

  return buf;
};

const parseCall = (
  buf: Uint8Array
): Call => {
  return deserialize(callSchema, Call, Buffer.from(buf));
};

const buildOutcome = (
  outcome: Outcome
): Uint8Array => {
  const buf = serialize(outcomeSchema, outcome);

  return buf;
};

const parseOutcome = (
  buf: Uint8Array
): Outcome => {
  return deserialize(outcomeSchema, Outcome, Buffer.from(buf));
};

export {
  WrappedCall, Call, callSchema, buildCall, parseCall,
  WrappedOutcome, Outcome, outcomeSchema, buildOutcome, parseOutcome
};
