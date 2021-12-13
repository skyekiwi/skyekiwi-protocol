// Copyright 2021 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Call, RequestDispatch, RequestInitializeContract,  } from './types';

import { randomBytes } from 'tweetnacl';
import { indexToString, u8aToHex } from '@skyekiwi/util';

export const accounts = [
  { 'seed': 'chest outdoor oven risk yellow license stamp donate old gift artwork know', 'secretKey': '01380e31f4eeb4a4b5a6174c722a1ed36ce825d5116b70c55b0ee65220566b30', 'publicKey': '0d337495ed789b12123b137f0720e1c0e46fc5488fb3dfa61b745be3041af608', 'address': '5Ep4PvsbESfADqKf8Lkd83kVvQorXv3cYD5RshXWK4hmdLP5' },
  { 'seed': 'fork over title copper hurry public leopard anchor type soccer physical patient', 'secretKey': '30557225e3b027a7fed8395c04c3946b5f5cc5da2bfc585f7ba8043065a52d70', 'publicKey': '1f805eba35ed05495205102abdc99b042d965833bcf7c77a02f7223e81ce012b', 'address': '5DupjaHG8gEc4N3gBMAAH6AfngbtZ9uk8XQC8p5ALow8STw2' },
  { 'seed': 'session magnet unfair lawsuit mother vague basic clog slim seek pudding hospital', 'secretKey': '371e9fbe6c15e057da153de0b2a14b30d0b19ff12a95ed4dd544ca7eb88ce34a', 'publicKey': '10d57efe846a1b863b7561f859a8a2d00135d6dee43e91fed59952c40f773e21', 'address': '5HNcyybbENPvysabdwmftDmxQZAEEKR23asVfEpGJY5ncA1h' },
  { 'seed': 'symbol glimpse fruit main buyer demise private purpose match stereo history embrace', 'secretKey': '34c534581876e872a20f0aeef5a910631f6cb3c87390131b6092fae1dc45cea0', 'publicKey': 'e21505a291514599b7ce525e609635c6a99be715d6ffef5c2a270c9c70232b4f', 'address': '5E5xYoWcr8G8UFUj6cvme7mSyv7twJ1fCN7Lxg5sx874Ue8u' },
  { 'seed': 'relief artefact critic primary adapt arrive cradle fragile river inhale lava position', 'secretKey': '6076d2cba5a99880f08254792f444dc0c086c2233cc65f125d3d9e92933fa541', 'publicKey': '1d4d3726c883abf986d2de39b7d982baf4ce2d640d8e5f317bedd79b32e48615', 'address': '5HNVyZPHqphP5zY9cMFCSjXEhRsuCBDJgxHbB5sMqWyZRN3Q' },
  { 'seed': 'cat fox return sheriff shrimp sustain quote learn disagree silk fire traffic', 'secretKey': '6f6bdc710c114626c7fa48eeb407f3ae5f42d7907e63d3acf36df970bda5280f', 'publicKey': 'c8f28f8ccf42e8c96d4ea630a93acb76118a79863f78dbfc3ef5c306355f3814', 'address': '5CSipZG1FfFQSwJ7ZW2S8JUDhhsALehZkvT6XVQ4oU7XNfpp' },
  { 'seed': 'model truth quantum crunch pole approve alley fame avocado custom reason marine', 'secretKey': '2dff59c1787cfc9308fd2aa525c9d92d6a53e64eb139fe3eff050e5ad052f645', 'publicKey': '568623ed08d157b6711c9f74b953dd1ddb542f8e67e0dd2c28bd394044812672', 'address': '5FELGaMiM6hAq7GScM4AERJyuZ5R36GKKVfroGSBrmoZZmvb' },
  { 'seed': 'orbit prison balcony toe deny effort raw relax coast domain seek squeeze', 'secretKey': '4908aea77cd595ba46b36d189d642c7baf46643ba87f617ffa7110c407547b00', 'publicKey': '49f6837dce335ac2220b2aa57c69a181cdcb07913b167f3175dc12889a59ba01', 'address': '5GTFuBUctyDvCNx9mvK8r9hhm8HskmZQ6cMMs7yDhZpBscZR' },
  { 'seed': 'dune artwork wild off genre tragic globe memory tube dutch reason save', 'secretKey': '13e7a61dbe3328492cf2ec221e4eb7fdcd684c9e790328514ef07e117c3d7f76', 'publicKey': 'b10c4c373ace6712b3d2ef658c6b49af35b36c703d58b342d7229500358d9e78', 'address': '5Fo9Qy7tYndrpSn66z4SnqQRDNmo2ofHJJhH8tXK1pZrWwob' },
  { 'seed': 'feature valve gospel random spy rare release round frown enable lamp exclude', 'secretKey': '9fde0bc4cb5ce3c3bfd140be556acc5d4482c7c2376961a547cb9dff6c9403ef', 'publicKey': 'd146bdd9b85aafdb4ac50242d649e8ad8ad66b8639f14e98980f5648dd516214', 'address': '5DiBVzPz4SVuCpDdgAN9A9kUrBWsE35tcacKrMhfyko4GTdF' }
]

export class MockBlockchainEnv {

  // Map contractId -> nextCallIndex(as number)
  #nextCallIndex: { [key: string]: number }
  
  // num of blocks to mock
  #blockNum: number

  constructor(blockNum: number) {
    this.#nextCallIndex = {}
  }

  public spanwCalls(contractId: string): Call[] {
    const numberOfCalls = parseInt(Math.random() * 10 + '');
    const calls: Call[] = [];

    let callIndex = this.#nextCallIndex[contractId] ? this.#nextCallIndex[contractId] : 0;


    for (let i = 0; i < numberOfCalls; i++) {
      const origin = parseInt(Math.random() * 10 + '');
      const encrypted = (parseInt(Math.random() * 10 + '') % 4 === 0)
      const methodName = (parseInt(Math.random() * 10 + '') % 4 === 0) ? 'get_greeting' : 'set_greeting'

      calls.push({
        callIndex: indexToString(callIndex++),
        contractId: contractId,
        encrypted: encrypted,
        methodName: methodName,
        origin: accounts[origin]['address'],
        parameters: u8aToHex(randomBytes(32)),
      })
    }

    this.#nextCallIndex[contractId] = callIndex;
    return calls;
  }

  public spawnNewContractReq(callback: Function, contractId: string): void {
    callback({
      contractId: contractId,
      highRemoteCallIndex: indexToString(0)
    } as RequestInitializeContract)
  }

  public spawnBlocks(callback: Function): void {
    // const contractIds = ['0x0001b4'];
    const contractId = '0x0001b4';

    let num = 0;
    setInterval(() => {
      if (num > this.#blockNum) {
        return;
      }
      num ++;
      callback(
        {
          calls: this.spanwCalls(contractId)
        } as RequestDispatch
      )
    }, 600)
  }
}
