import { stringToU8a, u8aToString } from '@polkadot/util';

const hexToU8a = (hex: string) => {
  if (isValidHex(hex)) {
    return new Uint8Array(hex.match(/[0-9A-Fa-f]{1,2}/g).map(byte => parseInt(byte, 16)));
  } else {
    throw new Error("invalid hex string: Util.hexToU8a")
  }
}

const u8aToHex = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const isValidHex = str => {
  return (str.length & 1) === 0 && 
    (/^[0-9A-Fa-f]*$/g).test(str)
}
const numberPadding = n => {
  return String(n).padStart(16, '0')
}

const trimEnding = (str: string) => {
  const len = str.length
  if (str[len - 1] === '|' || str[len - 1] === '-' || str[len - 1] === ' ') {
    return str.substring(0, len - 1)
  } else return str
}
export {
  hexToU8a, u8aToHex, isValidHex, 
    
  numberPadding,
  
  stringToU8a, u8aToString, trimEnding
}
