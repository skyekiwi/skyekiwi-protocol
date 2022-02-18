// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { mnemonicToMiniSecret, mnemonicValidate } from '@polkadot/util-crypto';

import { DefaultSealer, EncryptionSchema } from '@skyekiwi/crypto';
import { Driver } from '@skyekiwi/driver';
import { SecretContract } from '@skyekiwi/driver/types';
import { SecretRegistry } from '@skyekiwi/secret-registry';
import { hexToU8a } from '@skyekiwi/util';

import { buildCalls, Calls, parseCalls } from './borsh';

export class Contract {
  public static buildInitialState (calls: Calls): Uint8Array {
    return buildCalls(calls);
  }

  public static parseInitialState (encodedCalls: Uint8Array): Calls {
    return parseCalls(encodedCalls);
  }

  public static intoSecretContract (calls: Calls, wasmBlob: Uint8Array): SecretContract {
    return {
      initialState: Contract.buildInitialState(calls),
      wasmBlob: wasmBlob
    };
  }

  public static async upstream (registry: SecretRegistry, contract: SecretContract): Promise<number> {
    const mnemonic = process.env.SEED_PHRASE;

    if (!mnemonicValidate(mnemonic)) {
      throw new Error('mnemonic failed to read - e2e.spec.ts');
    }

    await registry.init();

    if (contract.initialState.length !== 0) {
      const provider = new WsProvider('wss://staging.rpc.skye.kiwi');
      const api = await ApiPromise.create({ provider: provider });

      const encryptionSchema = new EncryptionSchema();
      const sksRaw = await api.query.registry.secretKeepers();
      const sks = sksRaw.toJSON() as unknown as string[];

      const sealer = new DefaultSealer();

      sealer.unlock(mnemonicToMiniSecret(process.env.SEED_PHRASE));

      if (!sks || sks.length === 0) {
        console.warn('no secret keepers found. Testing mode only.');
        encryptionSchema.addMember(sealer.getAuthorKey());
      } else {
        for (const sk of sks) {
          const pk = (await api.query.registry.publicKey(sk)).toString();

          encryptionSchema.addMember(hexToU8a(pk));
        }
      }

      return await Driver.upstreamContract(
        registry, contract, sealer, encryptionSchema
      );
    } else {
      return await Driver.upstreamContract(registry, contract);
    }
  }

  public static async downstream (registry: SecretRegistry, secretId: number): Promise<SecretContract> {
    const mnemonic = process.env.SEED_PHRASE;

    if (!mnemonicValidate(mnemonic)) {
      throw new Error('mnemonic failed to read - e2e.spec.ts');
    }

    await registry.init();

    const sealer = new DefaultSealer();

    sealer.unlock(mnemonicToMiniSecret(mnemonic));

    return await Driver.downstreamContract(
      secretId, registry, [mnemonicToMiniSecret(mnemonic)], sealer
    );
  }
}
