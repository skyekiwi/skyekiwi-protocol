import secrets from '@skyekiwi/secrets'
import {Util} from '../index'

// 32 bytes
const SKYEKIWI_SECRETS_ENDING = 
  "1122334455667788990011223344556677889900112233445566778899002619"

// TODO: secret.js needs to be replaced by a better impl
// the padding issue is stupid
// secret.js gives a hex string that has 
// half byte BITS + 1 bytes ID + N bytes of value 
// the half byte cannot be parse to U8A correctly 

class TSS {

  public static generateShares(
    message: Uint8Array,
    numShares: number,
    threshold: number
  ): Uint8Array[] {
    const messageHexString = Util.u8aToHex(message)
    const wrappedMessageHexString = messageHexString + SKYEKIWI_SECRETS_ENDING

    // Proceed with TSS
    const shares = secrets.share(wrappedMessageHexString, numShares, threshold)

    // get rid of the BITS field, where they create wrong u8a
    // it should be set by default to 8. 
    // I cannot think of a chance if the below error can be thrown, 
    // given the secret.js params is not changes
    const derivedSharing = shares.map(share => {
      if (share[0] != '8') {
        throw new Error('finite field broken somehow - TSS.generateShares')
      }
      return share.slice(1)
    })

    const shares_u8a = derivedSharing.map(Util.hexToU8a);
    return shares_u8a
  }

  public static recover(shares: Uint8Array[]): Uint8Array {
    const sharesInHexString: string[] = shares.map(Util.u8aToHex)

    // Recover by TSS
    // similar to shares generation, reverse the process by putting back the BITS
    const wrappedResult = secrets.combine(sharesInHexString.map(share => '8' + share))

    if (wrappedResult.slice(wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length)
      !== SKYEKIWI_SECRETS_ENDING) {
      throw new Error("decryption failed, most likely because threshold is not met - TSS.recover")
    }

    return Util.hexToU8a(
      wrappedResult.slice(0,
        wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length
      )
    );
  }
}

export { TSS, SKYEKIWI_SECRETS_ENDING }
