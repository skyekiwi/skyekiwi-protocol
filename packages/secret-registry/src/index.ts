// Copyright 2021-2022 @skyekiwi/wasm-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';

import { hexToU8a, u8aToHex } from '@skyekiwi/util';

export class SecretRegistry {
  public static registerSecret (api: ApiPromise, metadata: Uint8Array): Uint8Array {
    return api.tx.secrets.registerSecret('0x' + u8aToHex(metadata)).toU8a();
  }

  public static updateMetadata (api: ApiPromise, secretId: number, metadata: Uint8Array): Uint8Array {
    return api.tx.secrets.updateMetadata(secretId, '0x' + u8aToHex(metadata)).toU8a();
  }

  /**
   * get the next avaliable secret id
   * @returns {Promise<number>} the secret id
  */
  public static async nextSecretId (api: ApiPromise): Promise<number> {
    const result = await api.query.secrets.currentSecretId();

    return Number(result.toString());
  }

  /**
   * get metadata by secretId
   * @param {number} secretId secretId of the secret to be queryed
   * @returns {Promise<String>} secret metadata in form of IPFS CID
  */
  public static async getMetadata (api: ApiPromise, secretId: number): Promise<Uint8Array> {
    const metadataHashRaw = await api.query.secrets.metadata(secretId);
    const metadataHash = hexToU8a(metadataHashRaw.toString().substring(2));

    const preimageRaw = await api.query.preimage.preimageFor(metadataHash);
    const preimageHex = preimageRaw.toJSON().toString().substring(2);

    return hexToU8a(preimageHex);
  }
}
