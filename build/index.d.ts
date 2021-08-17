import { getLogger } from './logger';
import { sendTx } from './sendTx';
declare const hexToU8a: (hex: string) => Uint8Array;
declare const u8aToHex: (bytes: Uint8Array) => string;
declare const isValidHex: (str: string) => boolean;
declare const numberPadding: (n: number) => string;
declare const trimEnding: (str: string) => string;
export { hexToU8a, u8aToHex, isValidHex, numberPadding, trimEnding, getLogger, sendTx };
