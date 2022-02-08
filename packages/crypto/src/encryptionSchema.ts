// Copyright 2021 - 2022 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getLogger, u8aToHex } from '@skyekiwi/util';

export class EncryptionSchema {
  public members: Uint8Array[]
  public isPublic: boolean

  /**
   * Constructor for an EncryptionSchema
   * @constructor
   * @param {Uint8Array} author curve25519 public key of the secret author
   * @param {number} numOfShares total number of shares
   * @param {number} threshold threshold of shares needed for recovery
   * @param {number} unencryptedPieceCount number of pieces left unencrypted
  */
  constructor (
    isPublic = false
  ) {
    this.isPublic = isPublic;
    this.members = [];
  }

  /**
    * add in a receiving number to the encryption schema
    * @param {Uint8Array} memberPublicKey a 32 bytes curve25519 public key of the receiver
    * @returns {void} None
  */
  public addMember (memberPublicKey: Uint8Array): void {
    const logger = getLogger('EncryptionSchema.addMmber');

    if (memberPublicKey.length !== 32) {
      logger.error(`memberPublic key not valid, received ${u8aToHex(memberPublicKey)}`);
      throw new Error('member public key error - crypto/encryptionSchema/addMember');
    }

    logger.info(`adding member ${u8aToHex(memberPublicKey)} to the encryption schema`);
    this.members.push(memberPublicKey);
  }
}
