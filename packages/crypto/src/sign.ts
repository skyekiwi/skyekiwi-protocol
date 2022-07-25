// Copyright 2021-2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signature } from './types';

import { ethers } from 'ethers';

import { hexToU8a } from '@skyekiwi/util';

import { Sign } from './interface';

export class EthereumSign implements Sign {
  /**
    * get the secp251k1 public key from secret key
    * @param {Uint8Array} key a secp256k1 secretKey
    * @returns {string} the computed publicKey
  */
  public getPublicKey (key: Uint8Array): Uint8Array {
    return hexToU8a(ethers.utils.computePublicKey(key));
  }

  /**
    * generate an Ehtereum style signature
    * @param {Uint8Array} key a secp256k1 secretKey
    * @param {Uint8Array} message a message to be signed; not hashed
    * @returns {Promise<Signature>} the generated Signature
  */
  public async generateSignature (key: Uint8Array, message: Uint8Array): Promise<Signature> {
    const wallet = new ethers.Wallet(key);
    const sig = await wallet.signMessage(ethers.utils.hashMessage(message));

    return {
      ethereum: sig,
      message: message,
      publicAddress: wallet.address,
      publicKey: ethers.utils.computePublicKey(key)
    };
  }

  /**
   * verify an ethereum signature
   * @param {Signature} signature a signature object generated by generateSignature
   * @returns {boolean} the validity of the signature
  */
  public verifySignature (signature: Signature): boolean {
    return (
      signature.publicAddress === ethers.utils.verifyMessage(ethers.utils.hashMessage(signature.message), signature.ethereum)
    );
  }
}
