import { Connection } from '@solana/web3.js';
export declare class Token {
    private readonly _connection;
    constructor(connection: Connection);
    isToken2022(mintAddress: string): Promise<boolean>;
    /**
     * Detect token type and get balance
     * @param walletAddress Wallet address
     * @param tokenMintAddress Token Mint address
     * @returns Promise object containing balance and whether it is Token-2022
     */
    detectTokenTypeAndGetBalance(walletAddress: string, tokenMintAddress: string): Promise<{
        balance: number;
        isToken2022: boolean;
    }>;
    /**
     * Batch detect token type and get balance
     * @param walletAddress Wallet address
     * @param tokenMintAddresses Token Mint address array
     * @returns Promise<{ tokenMintAddress: string; balance: number; isToken2022: boolean }[]>
     */
    batchDetectTokenTypeAndGetBalance(walletAddress: string, tokenMintAddresses: string[]): Promise<{
        tokenMintAddress: string;
        balance: number;
        isToken2022: boolean;
    }[]>;
}
