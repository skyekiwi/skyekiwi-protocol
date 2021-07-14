import path from 'path'
import fs from 'fs'
import { randomBytes } from 'tweetnacl';
import * as SkyeKiwi from '../src/index'

let files_path = []

export async function del(file) {
  return new Promise((res, rej) => {
    fs.unlink(file, (err) => {
      if (err) rej(err)
      res(true)
    });
  });
}

export async function setup(num: number) {

  let files = []
  for (let i = 0; i < num; i ++) {
    const content = randomBytes(12000000)
    const filePath = path.join(__dirname, `/tmp/${i}.file`)
    files_path.push(filePath)

    try {
      await del(filePath)
    } catch(err) {
      //pass
    }

    await SkyeKiwi.File.writeFile(Buffer.from(content), filePath, 'a')

    files.push({
      file: new SkyeKiwi.File(
        `/tmp/${i}.file`,
        fs.createReadStream(filePath, { highWaterMark: 1 * (10 ** 8) })
      ),
      content: content
    })
  }

  return files
}

export function downstreamPath(num: number) {
  const x = path.join(__dirname, `/tmp/down${num}.file`)
  files_path.push(x)
  return x
}

export const cleanup = async () => {
  for (let p of files_path) {
    try {await del(p)}catch(err) {}
  }
}
