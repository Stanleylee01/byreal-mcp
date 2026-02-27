import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
/**
 * Estimate compute units required for a transaction
 * @param connection - Solana connection instance
 * @param instructions - Instructions to estimate
 * @param payerPublicKey - Payer public key
 * @param _blockhash - Optional blockhash
 * @returns Estimated compute unit count
 */
export declare function estimateComputeUnits(connection: Connection, instructions: TransactionInstruction[], payerPublicKey: PublicKey, _blockhash?: string): Promise<number>;
