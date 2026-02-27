import { PublicKey } from '@solana/web3.js';
export type PublicKeyish = PublicKey | string;
export declare function tryParsePublicKey(v: string): PublicKey | string;
export declare function solToWSol(mint: PublicKeyish): PublicKey;
/**
 * Validate and parse public key
 *
 * @param publicKey Public key
 * @param solToWSol Whether to convert SOL to WSOL
 */
export declare function validateAndParsePublicKey({ publicKey: orgPubKey, solToWSol, }: {
    publicKey: PublicKeyish;
    solToWSol?: boolean;
}): PublicKey;
