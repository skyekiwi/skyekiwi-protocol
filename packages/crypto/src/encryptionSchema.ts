// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

export class EncryptionSchema {
  public author: Uint8Array
  public members: Uint8Array[]
  public numOfShares: number
  public threshold: number
  public unencryptedPieceCount: number

  /**
   * Constructor for an EncryptionSchema
   * @constructor
   * @param {Uint8Array} author curve25519 public key of the secret author
   * @param {number} numOfShares total number of shares
   * @param {number} threshold threshold of shares needed for recovery
   * @param {number} unencryptedPieceCount number of pieces left unencrypted
  */
  constructor (config: {
    author: Uint8Array,
    numOfShares: number,
    threshold: number,
    unencryptedPieceCount: number
  }) {
    this.author = config.author;
    this.members = [];
    this.numOfShares = config.numOfShares;
    this.threshold = config.threshold;
    this.unencryptedPieceCount = config.unencryptedPieceCount;
  }

  /**
    * add in a receiving number to the encryption schema
    * @param {Uint8Array} memberPublicKey a 32 bytes curve25519 public key of the receiver
    * @param {number} shares number of shares to be assigned to this receiver
    * @returns {void} None
  */
  public addMember (memberPublicKey: Uint8Array, shares: number): void {
    for (let i = 0; i < shares; i++) { this.members.push(memberPublicKey); }
  }

  /**
    * total number of unique receivers
    * @returns {number} number of unique receivers in this encryptionSchema
  */
  public getNumOfParticipants (): number {
    // get all unique publicKey in this.members and
    // that's the number of participants
    return (this.members)
      .filter((item, index, array) => array.indexOf(item) === index)
      .length;
  }

  /**
    * verify the validity of an encryption schema
    * @returns {boolean} whether or not this encrytion schema is valid
  */
  public verify (): boolean {
    // pieces = public piece(s) + members' piece(s)
    if (this.numOfShares !== this.unencryptedPieceCount + this.members.length) {
      return false;
    }

    // quorum > pieces : a vault that can never be decrypt
    if (this.threshold > this.numOfShares) {
      return false;
    }

    return true;
  }
}
