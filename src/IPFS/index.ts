const ipfs = require('ipfs-core')

let fetch
if (typeof window === 'undefined') {
  fetch = require('node-fetch')
} else fetch = window.fetch

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
    // console.log("trying to pin to Infura")
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
    // console.log("trying to pin to SkyeKiwi")
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

  public async remoteGatewayAddAndPin(content: string) {
    try {
      return await this.addAndPinInfura(content)
    } catch (err) {
      try {
        return await this.addAndPinSkyeKiwi(content)
      } catch (err) {
        throw new Error("all remote pin failed - ipfs.remoteGatewayAddAndPin")
      }
    }
  }
  public async fetchFileFromRemote(cid: string) {
    
    try {
      const requests = [
        fetch(`https://ipfs.io/ipfs/${cid}`),
        fetch(`https://gateway.ipfs.io/ipfs/${cid}`),
        fetch(`https://gateway.originprotocol.com/ipfs/${cid}`),
        fetch(`https://bin.d0x.to/ipfs/${cid}`),
        fetch(`https://ipfs.fleek.co/ipfs/${cid}`),
        fetch(`https://cloudflare-ipfs.com/ipfs/${cid}`)
      ]
      const result = await Promise.race(requests)
      return await result.text()
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
