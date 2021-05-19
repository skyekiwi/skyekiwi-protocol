import {IPFS} from '../index'

class EncryptionSchema {
  public members: { [publicKey: string]: IPFS }

  constructor(
    public numOfShares: number,
    public threshold: number,

    public author: Uint8Array,

    public unencryptedPieceCount: number,

    public metadata_ipfs: IPFS,
    public public_pieces_ipfs: IPFS,
    

    public vaultStorageIPFS: IPFS
  ) {
    this.members = {}
  }

  public getNumOfParticipants() : number{
    // get all unique publicKey in this.members and 
    // that's the number of participants 
    return (Object.keys(this.members))
      .filter((item, index, array) => array.indexOf(item) === index)
      .length
  }

  public addMember(memberPublicKey: Uint8Array, memberIpfs: IPFS) {
    this.members[Buffer.from(memberPublicKey).toString('hex')] = memberIpfs
  }
}

export {EncryptionSchema}
