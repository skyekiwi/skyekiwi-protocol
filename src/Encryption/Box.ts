import { box, randomBytes } from 'tweetnacl';

class Box {
  private key: Uint8Array;

  constructor(secretKey: Uint8Array) {
    this.key = secretKey;
  }

  public getPublicKey() : Uint8Array {
    return box.keyPair.fromSecretKey(this.key).publicKey
  }
  public static getPublicKeyFromPrivateKey(secretKey: Uint8Array): Uint8Array {
    return box.keyPair.fromSecretKey(secretKey).publicKey
  }

  public encrypt(message: Uint8Array, receiverPublicKey: Uint8Array): Uint8Array {
    const nonce = randomBytes(box.nonceLength);
    const encrypted = box(message, nonce, receiverPublicKey, this.key);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return fullMessage;
  }

  public static decrypt(
    messageWithNonce: Uint8Array, 
    privateKey: Uint8Array,
    senderPublicKey: Uint8Array
  ): Uint8Array {
    const nonce = messageWithNonce.slice(0, box.nonceLength);
    const message = messageWithNonce.slice(
      box.nonceLength, messageWithNonce.length
    );

    const decrypted = box.open(message, nonce, senderPublicKey, privateKey);
    if (!decrypted) {
      throw new Error('decryption failed - Box.decrypt');
    }

    return decrypted;
  }

}
export {Box};
