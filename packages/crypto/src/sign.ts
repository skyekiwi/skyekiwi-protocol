// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { PublicKey, SecretKey } from './types';

import { Keyring } from '@polkadot/keyring';
import { encodeAddress, ethereumEncode, signatureVerify } from '@polkadot/util-crypto';
import { ethers } from 'ethers';

import { hexToU8a, u8aToHex } from '@skyekiwi/util';

export class Sign {
  /**
    * sign a message with @noble/secp256k1
    * @param {SecretKey} key a secretKey
    * @param {Uint8Array} message message to be signed
    * @returns {Uint8Array} Singature
  */
  public static sign (key: SecretKey, message: Uint8Array): Uint8Array {
    const kr = (new Keyring({ type: key.keyType })).addFromSeed(key.key);

    return kr.sign(message);
  }

  /**
    * verify a signature
    * @param {PublicKey} key a pubickey
    * @param {Uint8Array} message original message
    * @param {Uint8Array} signature signature to be verified
    * @returns {boolean} whether the siganture is valid
  */
  public static verify (key: PublicKey, message: Uint8Array, signature: Uint8Array): boolean {
    const s = signatureVerify(message, signature, key.keyType === 'ethereum' ? ethereumEncode(key.key) : encodeAddress(key.key));

    return s.isValid;
  }

  // TODO: ethersjs does not match singature result of polkadotjs
  // PolkadotJS uses @noble/secp256k1 and encode in DER
  // EthersJs does not and follow standard by eth rpc & uses elliptic lib for encoding
  // We might revisit this later but won't spend time to deal with it now

  /**
    * sign a message with @noble/secp256k1
    * @param {SecretKey} key a secretKey
    * @param {Uint8Array} message message to be signed
    * @returns {Uint8Array} Singature
  */
  public static async signWithEthersJs (key: SecretKey, message: Uint8Array): Promise<Uint8Array> {
    if (key.keyType !== 'ethereum') {
      throw new Error('only ethereum');
    }

    const wallet = new ethers.Wallet(key.key);

    return hexToU8a((await wallet.signMessage(message)).substring(2));
  }

  /**
    * verify a signature
    * @param {PublicKey} key a pubickey
    * @param {Uint8Array} message original message
    * @param {Uint8Array} signature signature to be verified
    * @returns {boolean} whether the siganture is valid
  */
  public static verifyWithEthersJs (key: PublicKey, message: Uint8Array, signature: Uint8Array): boolean {
    if (key.keyType !== 'ethereum') {
      throw new Error('only ethereum');
    }

    return ethereumEncode(key.key) === ethers.utils.verifyMessage(message, '0x' + u8aToHex(signature));
  }
}
