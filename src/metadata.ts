import secrets from 'secrets.js-grempe'
import crypto from 'eth-crypto'

import { IPFS } from './index'
import { EncryptionSchema, Metadata} from './types'


class MetadataHandler {
	encryptionSchema: EncryptionSchema 
	metadata: Metadata
	remoteMetadatCid: string

	constructor(encryptionSchema: EncryptionSchema) {
		this.encryptionSchema = encryptionSchema

		// pieces = public piece(s) + members' piece(s)
		if (this.encryptionSchema.pieces !== this.encryptionSchema.publicPieceCount
			+ Object.keys(this.encryptionSchema.members).length) {
				throw new Error("wrong pieces count supplied")
		}

		// quorum > pieces : a vault that can never be decrypt
		if (this.encryptionSchema.quorum > this.encryptionSchema.pieces) {
			throw new Error("wrong pieces count supplied")
		}
	}

	public async getIPFSMetadataNonce() {
		let nonce = -1
		if (this.remoteMetadatCid) {
			return JSON.parse(
				await this.encryptionSchema.
					metadata_ipfs.cat(this.remoteMetadatCid)
			).nonce
		}
		return nonce
	}

	public updateEncryptionSchema(newEncryptionSchema: EncryptionSchema) {
		this.encryptionSchema = newEncryptionSchema
	}

	async buildMetadata(chunk: string, name: string, note: string) {
		// fetch most updated nonce version
		const nonce = await this.getIPFSMetadataNonce()
		// const current_nonce = this.metadata.nonce

		// if (current_nonce < nonce) {
		// 	throw new Error("Nonce error - MetadataHandler:buildMetadata()")
		// }

		this.metadata = new Metadata(
			name, note, nonce,
			this.encryptionSchema, [], {}
		)
		
		console.log("processing shamir pieces")

		const msg = chunk
		const hexMsg = secrets.str2hex(JSON.stringify(msg))
		const shares = secrets.share(hexMsg,
			this.encryptionSchema.pieces,
			this.encryptionSchema.quorum)

		let pt = 0;
		
		console.log("processing public pieces")
		// first build public pieces
		for (; pt < this.encryptionSchema.publicPieceCount; pt++) {
			this.metadata.publicShares.push(
				await this.upload(
					shares[pt], 
					this.encryptionSchema.public_pieces_ipfs
				)
			)
		}
		
		console.log("processing private pieces")
		// then build members' piece(s)
		if (this.encryptionSchema.members != null) {
			for (let member in this.encryptionSchema.members) {
				this.metadata.pieces[member + ""] =
					await this.upload(
						await MetadataHandler.encrypt(member, shares[pt]),
						this.encryptionSchema.members[member]
					)
				pt += 1
			}
		}

		const newCid = await this.upload(
			JSON.stringify(this.metadata),
			this.encryptionSchema.metadata_ipfs
		)

		this.remoteMetadatCid = newCid
		return {cid: newCid, result: this.metadata}
	}

	async upload(content: string, ipfs: IPFS) {
		const result = await ipfs.add(content)
		await ipfs.pin(result.cid)

		console.log(result.cid.toString())
		return result.cid.toString()
	}

	async recover(metadataCID: string, publicKey: string, privateKey: string) {
		let contents = new Array()
		let metadata = JSON.parse(
				await this.encryptionSchema.metadata_ipfs.cat(metadataCID)
			)

		// collect all public pieces
		for (let content of metadata.publicShares){
			contents.push(await this.encryptionSchema.metadata_ipfs.cat(content))
		}

		// find & decrypt the piece related to the keypair supplies
		for (let key in metadata.pieces) {
			if (key == publicKey) {
				contents.push(
					await MetadataHandler.decrypt(
						privateKey,
						await this.encryptionSchema.members[key].cat(this.metadata.pieces[key])
					)
				)
			}
		}

		// quorum not met if 
		// all publicPieces + all private pieces decryptable by privateKey supplies
		if (contents.length < this.encryptionSchema.quorum) {
			throw new Error("decryption quorum not met: MetadataHandler.recover")
		}

		try {
			const result = JSON.parse(await MetadataHandler.recover(contents))
			return result
		} catch(err) {
			throw new Error("decryption failure: MetadataHandler.recover")
		}
	}

	static async encrypt(publicKey, content) {
		return crypto.cipher.stringify(
			await crypto.encryptWithPublicKey(publicKey, content))
	}

	static async decrypt(privateKey, content) {
		return await crypto.decryptWithPrivateKey(
			privateKey, crypto.cipher.parse(content))
	}

	static async recover(contents) {
		return await secrets.hex2str(secrets.combine(contents))
	}
}

export { MetadataHandler }
