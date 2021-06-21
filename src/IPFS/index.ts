const ipfs = require('ipfs-core')
const axios = require('axios')
const FormData = require('form-data')
require('dotenv').config()
const createClient = require('ipfs-http-client')
// import { Util } from '../index'

export class IPFS {
  private localIpfsReady: boolean
  private localIpfs: any

  constructor() {
    this.localIpfsReady = false
  }

  public async init() {
    if (!this.localIpfsReady) {
      this.localIpfsReady = true
      try {
        this.localIpfs = await ipfs.create()
      } catch(err) {
        // pass
        // this is where there is already an ipfs node running 
      }
    }
  }
  public async stopIfRunning() {
    if (this.localIpfsReady) {
      await this.localIpfs.stop()
    }
  }

  public async add(str: string) {
    const remoteResult = await this.remoteGatewayAddAndPin(str)
    if (remoteResult !== null) return remoteResult

    console.log(`all remote push failed, fallback to local IPFS, you need to keep the local IPFS running`)
    try {
      await this.init()
      const cid = await this.localIpfs.add(str);
      const fileStat = await this.localIpfs.files.stat("/ipfs/" + cid.path)
      return {
        cid: cid.path, size: fileStat.cumulativeSize
      }
    } catch (err) {
      console.error(err)
      throw (new Error('IPFS Failure: ipfs.add'))
    }
  }
  public async cat(cid: string) {

    if (cid.length !== 46) {
      throw new Error('cid length error: ipfs.cat')
    }

    try {
      let result = ''
      await this.init()
      for await (const chunk of this.localIpfs.cat(cid)) {
        result += chunk
      }
      return result
    } catch (err) {
      try {
        const remoteResult = await this.fetchFileFromRemote(cid)
        return remoteResult
      } catch (err) {
        console.error(err)
        throw (new Error('IPFS Failure: ipfs.cat'))
      }
    }
  }
  public async pin(cid: String) {
    try {
      return await this.localIpfs.pin.add(cid)
    } catch (err) {
      console.error(err)
      throw (new Error('IPFS Failure: ipfs.pin'))
    }
  }

  public async remoteGatewayAddAndPin(content: string) {
    let infuraResult
    let decooResult

    if (process.env.DECOO) {
      try {
        const form_data = new FormData();
        form_data.append("file", Buffer.from(content, 'utf-8'), 'upload');
        const request_config = {
          method: "post",
          url: 'http://api.decoo.io/pinning/pinFile',
          headers: {
            "Authorization": "Bearer " + process.env.DECOO,
            "Content-Type": "multipart/form-data",
            ...form_data.getHeaders()
          },
          data: form_data
        }

        decooResult = await axios(request_config)
        return { cid: decooResult.data.PinHash, size: decooResult.data.PinSize }
      } catch(err) {
        console.log('posting to Decoo failed')
        // console.log(err)

        try {
          const infura = createClient({
            host: 'ipfs.infura.io',
            port: 5001,
            protocol: 'https'
          })

          infuraResult = await infura.add(content)
          await infura.pin.add(infuraResult.cid.toString())

          return {
            cid: infuraResult.path,
            size: infuraResult.size
          }
        } catch (err) {
          return null
        }
      }
    } else {
      try {
        const infura = createClient({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https'
        })

        infuraResult = await infura.add(content)
        await infura.pin.add(infuraResult.cid.toString())

        return {
          cid: infuraResult.path,
          size: infuraResult.size
        }
      } catch (err) {
        return null
      }
    }
  }

  public async fetchFileFromRemote(cid: string) {
    try {
      const infura = createClient({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
      })
      let result = ""
      const stream = infura.cat(cid)
      for await (const chunk of stream) {
        result += chunk.toString()
      }
      return result
    } catch(err) {
      throw new Error('remote file fetching failed - ipfs.fetchFileFromRemote')
      // remote fetching failed, falling back to local
      return null
    }
  }
  public serialize() {
    return {}
  }
  public static parse() {
    return new IPFS()
  }
}
