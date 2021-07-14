export class EncryptionSchema {
  public members: Uint8Array[]

  constructor(
    public numOfShares: number,
    public threshold: number,

    public author: Uint8Array,
    public unencryptedPieceCount: number,
  ) {
    this.members = []
  }

  public getNumOfParticipants() : number{
    // get all unique publicKey in this.members and 
    // that's the number of participants 
    return (this.members)
      .filter((item, index, array) => array.indexOf(item) === index)
      .length
  }

  // 
  public addMember(memberPublicKey: Uint8Array, shares: number) {
    for (let i = 0 ; i < shares; i ++)
    this.members.push(memberPublicKey)
  }
}
