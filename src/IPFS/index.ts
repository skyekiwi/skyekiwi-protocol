import createClient from 'ipfs-http-client'
import { Util } from '../index'
const localIPFS = require('ipfs-core')

export class IPFSConfig {
  constructor(
    public host: string,
    public port: number,
    public protocol: 'https' | 'http' | 'ws'
  ) { }

  public serialize() {
    return Util.serialize({
      host: this.host,
      port: this.port,
      protocol: this.protocol
    })
  }

  public static parse(str: string) {
    return Util.parse(str)
  }
}

export class IPFS {
  private client: any
  private config: IPFSConfig

  constructor(config: IPFSConfig) {
    this.config = config
    this.client = createClient(config)
  }

  public async initLocalIPFS() {
    return await localIPFS.create()
  }
  public async add(str: string) {
    try {
      return await this.client.add(str)
    } catch (err) {
      console.log("remote gateway failing, fallback to local IPFS")
      try {
        const local = await this.initLocalIPFS()
        const cid = await local.add( str, {
            progress: (prog: any) => console.log(`add received: ${prog}`)
          }
        );
        const fileStat = await local.files.stat("/ipfs/" + cid.path)
        return {
          cid: cid.path, size: fileStat.cumulativeSize
        }
      } catch(err) {
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
      console.error(err)
      throw (new Error('IPFS Failure: ipfs.cat'))
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
