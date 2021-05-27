const hexToU8a = (hex: string) =>
  new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const u8aToHex = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export {
  hexToU8a, u8aToHex
}
