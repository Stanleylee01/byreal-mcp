import { PublicKey, TransactionInstruction } from '@solana/web3.js';
export declare const MAX_BASE64_SIZE = 1644;
export declare function checkV0TxSize({ instructions, payer, recentBlockhash, }: {
    instructions: TransactionInstruction[];
    payer: PublicKey;
    recentBlockhash?: string;
}): boolean;
