const ipfs = require('ipfs-core')
const fetch = require('node-fetch')

const createClient = require('ipfs-http-client')
// import { Util } from '../index'

export class IPFS {
  private localIpfsReady: boolean
  private localIpfs: any

  constructor() {
    this.localIpfsReady = false
  }

  public async init() { 
    try {
      console.log('init',this.localIpfs)
      this.localIpfsReady = true
      this.localIpfs = await ipfs.create()
    } catch(err) {
      console.error(err)
      // pass
      // this is where there is already an ipfs node running 
    }
  }

  public async stopIfRunning() {
    if (this.localIpfsReady) {
      await this.localIpfs.stop()
    }
  }

  public async add(str: string) {
    try {
      const remoteResult = await this.remoteGatewayAddAndPin(str)
      if (remoteResult !== null) return remoteResult
    } catch (err) {
      // pass
    }

    console.log(`all remote push failed, fallback to local IPFS, you need to keep the local IPFS running`)
    try {
      await this.init()

      console.log(this.localIpfs)

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

  public async addAndPinInfura(content: string) {
    // console.log("trying to pin to Infura")
    const infura = createClient({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        'Access-Control-Request-Method': 'POST',
        "Access-Control-Allow-Origin": '*',
      }
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
      protocol: 'http',
      headers: {
        'Access-Control-Request-Method': 'POST',
        "Access-Control-Allow-Origin": '*',
      }
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
      return await this.addAndPinSkyeKiwi(content)
    } catch (err) {
      console.error('skyekiwi pin', err)
      try {
        return await this.addAndPinInfura(content)
      } catch (err) {
        console.error('infura pin', err)
        throw new Error("all remote pin failed - ipfs.remoteGatewayAddAndPin")
      }
    }
  }
  public async fetchFileFromRemote(cid: string) {
    try {
      const requests = [
        fetch(`http://ipfs.io/ipfs/${cid}`, {mode: 'no-cors'}),
        fetch(`http://gateway.ipfs.io/ipfs/${cid}`, {mode: 'no-cors'}),
        fetch(`http://gateway.originprotocol.com/ipfs/${cid}`, {mode: 'no-cors'}),
        fetch(`http://ipfs.fleek.co/ipfs/${cid}`, {mode: 'no-cors'}),
        fetch(`http://cloudflare-ipfs.com/ipfs/${cid}`, {mode: 'no-cors'})
      ]
      const result = await Promise.race(requests)
      if (result.status != 200) {
        throw new Error("public gateway non-200 response - ipfs.fetchFileFromRemote")
      }
      return await result.text()
    } catch(err) {
      console.error('public gateway',err)
      try {
        console.log("public gateway failed. Trying Infura")
        const infura = createClient({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          headers: {
            "Access-Control-Allow-Origin": '*',
          }
        })
        let result = ""
        const stream = infura.cat(cid)
        for await (const chunk of stream) {
          result += chunk.toString()
        }
        return result
      } catch (err) {
        console.error('infura gateway',err)
        try {
          console.log("public gateway & Infura failed. Trying SkyeKiwi")
          const skyekiwiNode = createClient({
            host: 'sgnode.skye.kiwi',
            port: 5001,
            protocol: 'http',
            headers: {
              "Access-Control-Allow-Origin": '*',
            }
          })
          let result = ""
          const stream = skyekiwiNode.cat(cid)
          for await (const chunk of stream) {
            result += chunk.toString()
          }
          return result
        } catch (err) {
          console.error('skyekiwi gateway', err)
          throw new Error('remote file fetching failed - ipfs.fetchFileFromRemote')
        }
      }
    }
  }
}
