import { Connection } from '@solana/web3.js';
/**
 * Check if a mint is Token2022
 * @param mintAddress token mint address
 * @param connection Solana connection
 * @returns
 */
export declare function isToken2022(mintAddress: string, connection: Connection): Promise<boolean>;
