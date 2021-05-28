import { Util } from '../index'

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

  public serialize() {
    return Util.serialize({
      numOfShares: this.numOfShares,
      threshold: this.threshold,
      author: this.author,
      unencryptedPieceCount: this.unencryptedPieceCount,
      members: this.members,
      numOfParticipants: this.getNumOfParticipants()
    })
  }

  public static parse(str: string) {
    const object = Util.parse(str)

    if (!object.numOfShares || !object.threshold 
      || !object.author || !object.unencryptedPieceCount) {
        throw new Error('parse error: EncryptionSchema.parse')
      }
    

    let result = new EncryptionSchema(
      object.numOfShares, object.threshold,
      object.author, object.unencryptedPieceCount
    )
    for (let member of object.members) {
      if (member.constructor !== Uint8Array) {
        throw new Error('parse error: EncryptionSchema.parse')
      }
      result.addMember(member, 1)
    }

    return result
  }
}
