import { secretbox, randomBytes } from "tweetnacl";

export class SymmetricEncryption {
  public static encrypt(key: Uint8Array, message: Uint8Array): Uint8Array {
    const nonce = randomBytes(secretbox.nonceLength);
    const box = secretbox(message, nonce, key);

    const fullMessage = new Uint8Array(nonce.length + box.length);
    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);
    return fullMessage
  }

  public static decrypt (key: Uint8Array, messageWithNonce: Uint8Array): Uint8Array {
    const nonce = messageWithNonce.slice(0, secretbox.nonceLength);
    const message = messageWithNonce.slice(
      secretbox.nonceLength,
      messageWithNonce.length
    );
    
    const decrypted = secretbox.open(message, nonce, key);
    if (!decrypted) {
      throw new Error("decryption failed - SecretBox.decrypt");
    }

    return decrypted;
  }
}
