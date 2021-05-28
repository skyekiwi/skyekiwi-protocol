import fs from 'fs'

const hexToU8a = (hex: string) =>
  new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const u8aToHex = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const isValidHex = str => {
  return (str.length & 1) === 0 && 
    (/[0-9A-Fa-f]*/g).test(str)
}
const writeFile = (content: Buffer, filePath: string) => {
  return new Promise((res, rej) => {
    const stream = fs.createWriteStream(filePath)
    stream.write(content)
    stream.end()
    stream.on('finish', () => res(true))
    stream.on('error', rej)
  })
}
const serialize = (object: any) : string => {
  return JSON.stringify(object)
}
const parse = (str: string) : any => {
  return JSON.parse(str)
}

export {
  hexToU8a, u8aToHex, writeFile, isValidHex, serialize, parse
}
