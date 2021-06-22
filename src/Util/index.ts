import * as SkyeKiwi from '../index'

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

const serialize = (object: any) : string => {
  for (let key in object) {
    if (object[key].constructor === Uint8Array) {
      object[key] = u8aToHex(object[key])
    }
    else if (object[key].constructor === Buffer) {
      object[key] = u8aToHex(Uint8Array.from(object[key]))
    }
    else if (object[key].constructor === SkyeKiwi.Chunks ||
      object[key].constructor === SkyeKiwi.Seal ||
      object[key].constructor === SkyeKiwi.File ||
      object[key].constructor === SkyeKiwi.IPFS ||
      object[key].constructor === SkyeKiwi.EncryptionSchema ||
      object[key].constructor === SkyeKiwi.Metadata) {
      object[key] = object[key].serialize()
    }
    else if (Array.isArray(object[key])) {
      object[key] = serialize(object[key])
    }
  }
  return JSON.stringify(object)
}

const parse = (str: string) : any => {
  try {
    const object = JSON.parse(str)
    for (let key in object) {
      let obj = object[key]
      if (typeof obj === 'string' && isValidHex(obj)) {
        object[key] = hexToU8a(obj)
      } else {
        try {
          object[key] = parse(obj)
        } catch (err) {
          // pass
        }
      }
    }
    return object
  } catch (err) {
    return str
  }
}

export {
  hexToU8a, u8aToHex, isValidHex, serialize, parse
}
