import secrets from 'secrets.js-grempe'
import {
  hexToU8a, u8aToHex
} from './index'

// 32 bytes
const SKYEKIWI_SECRETS_ENDING = "244ccad30a21fbadd7330bf9d187a6dd26d464cb4da4eb4a61a55670b37b2619"

class TSSTest {

  public static generateShares(
    message: Uint8Array, 
    numShares: number, 
    threshold: number
  ) : Uint8Array[] {
    const messageHexString = u8aToHex(message)
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

    const shares_u8a = derivedSharing.map(hexToU8a);
    return shares_u8a
  }

  public static recover(shares:Uint8Array[]): Uint8Array {
    const sharesInHexString: string[] = shares.map(u8aToHex)

    // Recover by TSS
    // similar to shares generation, reverse the process by putting back the BITS
    const wrappedResult = secrets.combine(sharesInHexString.map(share => '8' + share))

    if (wrappedResult.slice(wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length) 
      !== SKYEKIWI_SECRETS_ENDING) {
      throw new Error("decryption failed, most likely because threshold is not met - TSS.recover")
    }

    return hexToU8a(
      wrappedResult.slice(0, 
        wrappedResult.length - SKYEKIWI_SECRETS_ENDING.length
      )
    );
  }
}

export { TSSTest, SKYEKIWI_SECRETS_ENDING }
