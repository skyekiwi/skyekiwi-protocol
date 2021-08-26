// Copyright 2021 @skyekiwi/crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

export class EncryptionSchema {
  public author: Uint8Array
  public members: Uint8Array[]
  public numOfShares: number
  public threshold: number
  public unencryptedPieceCount: number

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

  public addMember (memberPublicKey: Uint8Array, shares: number): void {
    for (let i = 0; i < shares; i++) { this.members.push(memberPublicKey); }
  }

  public getNumOfParticipants (): number {
    // get all unique publicKey in this.members and
    // that's the number of participants
    return (this.members)
      .filter((item, index, array) => array.indexOf(item) === index)
      .length;
  }

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
