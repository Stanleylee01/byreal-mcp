import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { IPersonalPositionLayout } from './layout.js';
import { IPoolLayoutWithId, ITokenInfo } from './models.js';
export declare class Instruction {
    static createPoolInstruction(props: {
        programId: PublicKey;
        owner: PublicKey;
        poolManager: PublicKey;
        mintA: ITokenInfo;
        mintB: ITokenInfo;
        ammConfigId: PublicKey;
        initialPriceX64: BN;
        openTime?: BN;
        extendMintAccount?: PublicKey[];
    }): Promise<{
        instructions: TransactionInstruction[];
    }>;
    static openPositionFromLiquidityInstruction(params: {
        poolInfo: IPoolLayoutWithId;
        ownerInfo: {
            feePayer: PublicKey;
            wallet: PublicKey;
            tokenAccountA: PublicKey;
            tokenAccountB: PublicKey;
        };
        tickLower: number;
        tickUpper: number;
        liquidity: BN;
        amountMaxA: BN;
        amountMaxB: BN;
        withMetadata: 'create' | 'no-create';
    }): Promise<{
        instructions: TransactionInstruction[];
        signers: Signer[];
    }>;
    static openPositionFromBaseInstruction(params: {
        poolInfo: IPoolLayoutWithId;
        ownerInfo: {
            feePayer: PublicKey;
            wallet: PublicKey;
            tokenAccountA: PublicKey;
            tokenAccountB: PublicKey;
        };
        tickLower: number;
        tickUpper: number;
        base: 'MintA' | 'MintB';
        baseAmount: BN;
        otherAmountMax: BN;
        withMetadata: 'create' | 'no-create';
    }): Promise<{
        instructions: TransactionInstruction[];
        signers: Signer[];
    }>;
    static closePositionInstruction(params: {
        programId: PublicKey;
        nftMint: PublicKey;
        ownerWallet: PublicKey;
    }): Promise<{
        instructions: TransactionInstruction[];
    }>;
    static increasePositionFromLiquidityInstructions(params: {
        poolInfo: IPoolLayoutWithId;
        ownerPosition: IPersonalPositionLayout;
        ownerInfo: {
            wallet: PublicKey;
            tokenAccountA: PublicKey;
            tokenAccountB: PublicKey;
        };
        liquidity: BN;
        amountMaxA: BN;
        amountMaxB: BN;
    }): Promise<{
        instructions: TransactionInstruction[];
    }>;
    static increasePositionFromBaseInstructions(params: {
        poolInfo: IPoolLayoutWithId;
        ownerPosition: IPersonalPositionLayout;
        ownerInfo: {
            wallet: PublicKey;
            tokenAccountA: PublicKey;
            tokenAccountB: PublicKey;
        };
        base: 'MintA' | 'MintB';
        baseAmount: BN;
        otherAmountMax: BN;
    }): Promise<{
        instructions: TransactionInstruction[];
    }>;
    static decreaseLiquidityInstructions(params: {
        poolInfo: IPoolLayoutWithId;
        ownerPosition: IPersonalPositionLayout;
        ownerInfo: {
            wallet: PublicKey;
            tokenAccountA: PublicKey;
            tokenAccountB: PublicKey;
        };
        liquidity: BN;
        amountMinA: BN;
        amountMinB: BN;
    }): Promise<{
        instructions: TransactionInstruction[];
    }>;
    static swapBaseInInstruction(params: {
        poolInfo: IPoolLayoutWithId;
        ownerInfo: {
            wallet: PublicKey;
            tokenAccountA: PublicKey;
            tokenAccountB: PublicKey;
        };
        amount: BN;
        otherAmountThreshold: BN;
        sqrtPriceLimitX64: BN;
        isInputMintA: boolean;
        exTickArrayBitmap?: PublicKey;
        tickArray: PublicKey[];
    }): Promise<{
        instructions: TransactionInstruction[];
    }>;
    static swapBaseOutInstruction(params: {
        poolInfo: IPoolLayoutWithId;
        ownerInfo: {
            wallet: PublicKey;
            tokenAccountA: PublicKey;
            tokenAccountB: PublicKey;
        };
        amount: BN;
        otherAmountThreshold: BN;
        sqrtPriceLimitX64: BN;
        isOutputMintA: boolean;
        exTickArrayBitmap?: PublicKey;
        tickArray: PublicKey[];
    }): Promise<{
        instructions: TransactionInstruction[];
    }>;
}
