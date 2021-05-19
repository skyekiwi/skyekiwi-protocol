import createClient from 'ipfs-http-client'
import { IPFSConfig } from '../types'


class IPFS {
	private client: any
	private config: IPFSConfig

	constructor(config: IPFSConfig) {
		this.config = config
		this.client = createClient(config)
	}
	
	public async add(str:String) {
		try {
			return await this.client.add(str)
		} catch (err) {
			console.error(err)
			throw (new Error('IPFS Failure: ipfs.add'))
		}
	}
	public async cat(cid:String) {
		// TODO: check CID validity
		let result = ''
		try {
			const stream = this.client.cat(cid)
			for await (const chunk of stream) {
				result += chunk.toString()
			}
			return result
		} catch(err) {
			console.error(err)
			throw (new Error('IPFS Failure: ipfs.cat'))
		}
	}
	public async pin(cid:String) {
		try {
			return await this.client.pin.add(cid)
		} catch (err) {
			console.error(err)
			throw (new Error('IPFS Failure: ipfs.pin'))
		}
	}
	public toString() {
		return this.config.toString()
	}
}
export {IPFS}
