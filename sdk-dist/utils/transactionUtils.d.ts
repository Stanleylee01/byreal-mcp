import { Connection, PublicKey, Signer, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
export declare const DEFAULT_COMPUTE_UNIT_PRICE = 50000;
export type IMakeTransactionOptions = {
    /**
     * Compute unit limit
     */
    computeUnitLimit?: number;
    /**
     * Compute unit price (microLamports)
     */
    computeUnitPrice?: number;
    /**
     * Whether to automatically add compute budget instructions
     */
    addComputeBudget?: boolean;
} & /**
 * maxFee and exactFee are mutually exclusive type definitions
 * maxFee: Maximum transaction fee (SOL)
 * exactFee: Exact transaction fee (SOL)
 */ ({
    maxFee: number;
    exactFee?: never;
} | {
    maxFee?: never;
    exactFee: number;
} | {
    maxFee?: undefined;
    exactFee?: undefined;
});
export type ISendTransactionOptions = {
    /**
     * Skip preflight
     */
    skipPreflight?: boolean;
    /**
     * Commit level
     */
    preflightCommitment?: 'processed' | 'confirmed' | 'finalized';
    /**
     * Maximum retry times
     */
    maxRetries?: number;
    /**
     * Transaction confirmation timeout (milliseconds)
     */
    confirmationTimeout?: number;
    /**
     * Transaction confirmation retry interval (milliseconds)
     */
    confirmationRetryInterval?: number;
    /**
     * Transaction confirmation retry times
     */
    confirmationRetries?: number;
};
/**
 * Create transaction object
 * @param connection - Solana connection instance
 * @param payerPublicKey - Payer public key
 * @param instructions - Transaction instruction list
 * @param options - Transaction options
 * @param signers - Additional signers (usually new Keypairs created by the program)
 * @returns Transaction object
 */
export declare function makeTransaction(params: {
    connection: Connection;
    payerPublicKey: PublicKey;
    instructions: TransactionInstruction[];
    signers?: Signer[];
    options?: IMakeTransactionOptions;
}): Promise<VersionedTransaction>;
/**
 * Generic function for sending transactions, supporting front-end wallet signatures
 * @param connection - Solana connection instance
 * @param signTx - Method for signing transactions, usually calling the signTransaction method of the plugin wallet and signing with the new Keypair created by the program
 * @param options - Transaction options
 * @returns Transaction hash
 */
export declare function sendTransaction(params: {
    connection: Connection;
    signTx: () => Promise<VersionedTransaction>;
    options?: ISendTransactionOptions;
}): Promise<string>;
