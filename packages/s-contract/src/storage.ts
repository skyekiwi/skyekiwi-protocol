// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DBOps } from './types';

import level from 'level';

import { Block, buildBlock, buildCall, buildContract, buildExecutionSummary, buildLocalMetadata, buildOutcome, buildShard, buildShardMetadata, Call, Contract, ExecutionSummary, LocalMetadata, Outcome, parseBlock,
  parseCall,
  parseContract,
  parseExecutionSummary,
  parseLocalMetadata,
  parseOutcome,
  parseShard,
  parseShardMetadata,
  Shard, ShardMetadata } from './borsh';

const numberPadding = (n: number, pad: number): string => {
  return String(n).padStart(pad, '0');
};

/* eslint-disable sort-keys, camelcase, @typescript-eslint/ban-ts-comment */
export class Storage {
  public static getCallIndex (shardId: number, callIndex: number): string {
    const shard = numberPadding(shardId, 4);
    const block = numberPadding(callIndex, 16);

    return shard + block + 'RAWC';
  }

  public static getCallOutcomeIndex (shardId: number, callIndex: number): string {
    const shard = numberPadding(shardId, 4);
    const block = numberPadding(callIndex, 16);

    return shard + block + 'OUTC';
  }

  public static getBlockIndex (shardId: number, blockNumber: number): string {
    const shard = numberPadding(shardId, 4);
    const block = numberPadding(blockNumber, 16);

    return shard + block + 'BLOC';
  }

  public static getContractIndex (contractIndex: number): string {
    return numberPadding(contractIndex, 20) + 'CONT';
  }

  public static getShardIndex (shardId: number): string {
    return numberPadding(shardId, 20) + 'SHAR';
  }

  public static getShardMetadataIndex (shardId: number): string {
    return numberPadding(shardId, 20) + 'SHAM';
  }

  public static writeMetadata (
    metadata: LocalMetadata
  ): DBOps {
    return {
      type: 'put',
      key: 'METADATA',
      value: buildLocalMetadata(metadata)
    };
  }

  public static async getMetadata (db: level.LevelDB): Promise<LocalMetadata> {
    return parseLocalMetadata(await db.get('METADATA'));
  }

  public static writeCallRecord (shard_id: number, callIndex: number, call: Call): DBOps {
    const key = Storage.getCallIndex(shard_id, callIndex);

    return {
      type: 'put',
      key: key,
      value: buildCall(call)
    };
  }

  public static writeCallOutcome (shardId: number, callIndex: number, outcome: Outcome): DBOps {
    const key = Storage.getCallOutcomeIndex(shardId, callIndex);

    return {
      type: 'put',
      key: key,
      value: buildOutcome(outcome)
    };
  }

  public static writeBlockRecord (shardId: number, blockNumber: number, block: Block): DBOps {
    const key = Storage.getBlockIndex(shardId, blockNumber);

    return {
      type: 'put',
      key: key,
      value: buildBlock(block)
    };
  }

  public static writeContractRecord (contractIndex: number, contract: Contract): DBOps {
    const key = Storage.getContractIndex(contractIndex);

    return {
      type: 'put',
      key: key,
      value: buildContract(contract)
    };
  }

  public static writeShardRecord (shardId: number, shard: Shard): DBOps {
    const key = Storage.getShardIndex(shardId);

    return {
      type: 'put',
      key: key,
      value: buildShard(shard)
    };
  }

  public static writeShardMetadataRecord (shardId: number, shardm: ShardMetadata): DBOps {
    const key = Storage.getShardIndex(shardId);

    return {
      type: 'put',
      key: key,
      value: buildShardMetadata(shardm)
    };
  }

  public static writeExecutionSummary (a: ExecutionSummary): DBOps {
    return {
      type: 'put',
      key: 'EXECUTION_SUMMARY',
      value: buildExecutionSummary(a)
    };
  }

  public static async writeAll (db: level.LevelDB, ops: DBOps[]): Promise<void> {
    // eslint-diable
    // @ts-ignore
    await db.batch(ops);
    // eslint-enable
  }

  public static async getCallRecord (
    db: level.LevelDB, shardId: number, callIndex: number
  ): Promise<Call> {
    const key = Storage.getCallIndex(shardId, callIndex);

    return parseCall(await db.get(key));
  }

  public static async getOutcomeRecord (
    db: level.LevelDB, shardId: number, callIndex: number
  ): Promise<Outcome> {
    const key = Storage.getCallOutcomeIndex(shardId, callIndex);

    return parseOutcome(await db.get(key));
  }

  public static async getBlockRecord (
    db: level.LevelDB, shardId: number, blockNumber: number
  ): Promise<Block> {
    const key = Storage.getBlockIndex(shardId, blockNumber);

    return parseBlock(await db.get(key));
  }

  public static async getContractRecord (
    db: level.LevelDB, contractIndex: number
  ): Promise<Contract> {
    const key = Storage.getContractIndex(contractIndex);

    return parseContract(await db.get(key));
  }

  public static async getShardRecord (
    db: level.LevelDB, shardId: number
  ): Promise<Shard> {
    const key = Storage.getShardIndex(shardId);

    return parseShard(await db.get(key));
  }

  public static async getShardMetadataRecord (
    db: level.LevelDB, shardId: number
  ): Promise<ShardMetadata> {
    const key = Storage.getShardMetadataIndex(shardId);

    return parseShardMetadata(await db.get(key));
  }

  public static async getExecutionSummary (
    db: level.LevelDB
  ): Promise<ExecutionSummary> {
    return parseExecutionSummary(await db.get('EXECUTION_SUMMARY'));
  }
}
