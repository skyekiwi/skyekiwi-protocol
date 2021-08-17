import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { KeyringPair } from '@polkadot/keyring/types';
/**
 * Send tx to Crust Network
 * @param {SubmittableExtrinsic} tx substrate-style tx
 * @param {string} seeds tx already been sent
 */
declare const sendTx: (extrinsic: SubmittableExtrinsic, signer: KeyringPair, logging?: boolean) => Promise<boolean>;
export { sendTx };
