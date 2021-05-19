import secrets from 'secrets.js-grempe'

// TODO: secrets.js is not a typescript lib, and it runs on hexString instead of Uint8Array
// So, we are forced to do many converting 
// Might wanna switch it to a better audited lib in the future

class TSS {

  // TODO: padding to remove info on the actual size of the content

  public static generateShares(
    message: Uint8Array, 
    numShares: number, 
    threshold: number
  ) : Uint8Array[] {

    const messageHexString = Buffer.from(message).toString('hex');
    const shares = secrets
      .share(messageHexString, numShares, threshold)
      .map(hexString => {
        return Uint8Array.from(Buffer.from(hexString, 'hex'));
      });
    return shares;
  }

  public static recover(shares:Uint8Array[]): Uint8Array {
    const sharesInHexString = shares.map(share => {
      return Buffer.from(share).toString('hex');
    })
    return Uint8Array.from(Buffer.from(secrets.combine(sharesInHexString), 'hex'));
  }
}

export { TSS }
