import createClient from 'ipfs-http-client'
import { Util } from '../index'
const localIPFS = require('ipfs-core')

export class IPFSConfig {
  constructor(
    public host: string,
    public port: number,
    public protocol: 'https' | 'http' | 'ws',
    public headers?: any
  ) { }

  public serialize() {
    return Util.serialize({
      host: this.host,
      port: this.port,
      protocol: this.protocol,
      headers: this.headers
    })
  }

  public static parse(str: string) {
    return Util.parse(str)
  }
}

export class IPFS {
  private client: any
  private config: IPFSConfig
  private localIpfsReady: boolean
  private localIpfs: any

  constructor(config: IPFSConfig) {
    this.config = config
    this.client = createClient(config)
    this.localIpfsReady = false
  }

  public async initLocalIPFS() {
    if (!this.localIpfsReady) {
      const localIpfs = await localIPFS.create()
      this.localIpfsReady = true
      this.localIpfs = localIpfs
    }
  }

  public async cleanup() {
    if (this.localIpfsReady) {
      await this.localIpfs.stop()
    }
  }

  public async add(str: string) {
    try {
      return await this.client.add(str)
    } catch (err) {
      console.log("remote gateway failing, fallback to local IPFS")
      try {
        await this.initLocalIPFS()
        const cid = await this.localIpfs.add(str, {
            progress: (prog: any) => console.log(`add received: ${prog}`)
          }
        );
        const fileStat = await this.localIpfs.files.stat("/ipfs/" + cid.path)
        return {
          cid: cid.path, size: fileStat.cumulativeSize
        }
      } catch (err) {
        console.error(err)
        throw (new Error('IPFS Failure: ipfs.add'))
      }
    }
  }
  public async cat(cid: string) {
    if (cid.length !== 46) {
      throw new Error('cid length error: ipfs.cat')
    }
    
    let result = ''
    try {
      const stream = this.client.cat(cid)
      for await (const chunk of stream) {
        result += chunk.toString()
      }
      return result
    } catch (err) {

      try {
        await this.initLocalIPFS()
        for await (const chunk of this.localIpfs.cat(cid)) {
          result += chunk
        }
        return result
      } catch(err) {
        console.error(err)
        throw (new Error('IPFS Failure: ipfs.cat'))
      }
    }
  }
  public async pin(cid: String) {
    try {
      return await this.client.pin.add(cid)
    } catch (err) {
      console.error(err)
      throw (new Error('IPFS Failure: ipfs.pin'))
    }
  }
  public serialize() {
    return this.config.serialize()
  }
  public static parse(str: string) {
    const config: IPFSConfig = IPFSConfig.parse(str)
    return new IPFS(config)
  }
}
