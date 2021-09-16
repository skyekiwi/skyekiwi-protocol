// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signature } from './types';

import { ethers } from 'ethers';

export interface Sign {
  generateSignature(key: Uint8Array, message: Uint8Array): Promise<Signature>,
  verifySignature(signature: Signature): boolean
}

export class EthereumSign implements Sign {
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

  public verifySignature (signature: Signature): boolean {
    return (
      signature.publicAddress === ethers.utils.verifyMessage(ethers.utils.hashMessage(signature.message), signature.ethereum)
    );
  }
}
