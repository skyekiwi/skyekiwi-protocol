const ipfs = require('ipfs-core')
const axios = require('axios')
const FormData = require('form-data')
require('dotenv').config()
const createClient = require('ipfs-http-client')
const https = require('https')
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
      console.log(cid)
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
      const remoteResult = await this.fetchFileFromRemote(cid)
      return remoteResult
    } catch (err) {
      try {
        let result = ''
        await this.init()
        for await (const chunk of this.localIpfs.cat(cid)) {
          result += chunk
        }
        return result
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

  public async addAndPinInfura(content: string) {
    console.log("trying to pin to Infura")
    const infura = createClient({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https'
    })

    const infuraResult = await infura.add(content)
    await infura.pin.add(infuraResult.cid.toString())

    return {
      cid: infuraResult.path,
      size: infuraResult.size
    }
  }

  public async addAndPinSkyeKiwi(content: string) {
    console.log("trying to pin to SkyeKiwi")
    const skyekiwiNode = createClient({
      host: 'sgnode.skye.kiwi',
      port: 5001,
      protocol: 'http'
    })

    const skyekiwiResult = await skyekiwiNode.add(content)
    await skyekiwiNode.pin.add(skyekiwiResult.cid.toString())

    return {
      cid: skyekiwiResult.path,
      size: skyekiwiResult.size
    }
  }

  public async addAndPinDecoo(content: string) {
    console.log("trying to pin to Decoo")
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
      timeout: 5000,
      data: form_data
    }

    const decooResult = await axios(request_config)
    return { cid: decooResult.data.PinHash, size: decooResult.data.PinSize }
  }

  public async remoteGatewayAddAndPin(content: string) {
    try {
      return await this.addAndPinSkyeKiwi(content)
    } catch(err) {
      if (process.env.DECOO) {
        try {
          return await this.addAndPinDecoo(content)
        } catch(err) {
          console.log('decoo pinning failed')
          return await this.addAndPinInfura(content)
        }
      } else {
        try {
          return await this.addAndPinInfura(content)
        } catch (err) {
          throw new Error("all remote pin failed - ipfs.remoteGatewayAddAndPin")
        }
      }
    }
  }

  public async fetchFileFromRemote(cid: string) {
    
    try {
      const request_configs = [{
        method: "GET",
        url: `https://ipfs.io/ipfs/${cid}`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }, {
        method: "GET",
        url: `https://gateway.ipfs.io/ipfs/${cid}`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }, {
        method: "GET",
        url: `https://gateway.originprotocol.com/ipfs/${cid}`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }, {
        method: "GET",
        url: `https://bin.d0x.to/ipfs/${cid}`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }, {
        method: "GET",
        url: `https://ipfs.fleek.co/ipfs/${cid}`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }, {
        method: "GET",
        url: `https://cloudflare-ipfs.com/ipfs/${cid}`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }]
      const requests = request_configs.map(config => axios(config))
      const result = await Promise.race(requests)
      return result.data
    } catch(err) {
      try {

        console.log("public gateway failed. Trying Infura")
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
      } catch (err) {
        try {
          console.log("public gateway & Infura failed. Trying SkyeKiwi")
          const skyekiwiNode = createClient({
            host: 'sgnode.skye.kiwi',
            port: 5001,
            protocol: 'http'
          })
          let result = ""
          const stream = skyekiwiNode.cat(cid)
          for await (const chunk of stream) {
            result += chunk.toString()
          }
          return result
        } catch (err) {
          throw new Error('remote file fetching failed - ipfs.fetchFileFromRemote')
        }
      }
    }
  }
  public serialize() {
    return {}
  }
  public static parse() {
    return new IPFS()
  }
}
