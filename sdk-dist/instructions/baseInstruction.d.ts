import { Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { ByrealClmm } from './target/types/byreal_amm_v3.js';
export declare const getAmmV3Program: (programId: PublicKey) => Program<ByrealClmm>;
export declare class BaseInstruction {
    static createPoolInstruction(programId: PublicKey, poolCreator: PublicKey, poolManager: PublicKey, ammConfigId: PublicKey, mintA: PublicKey, mintProgramIdA: PublicKey, mintB: PublicKey, mintProgramIdB: PublicKey, sqrtPriceX64: BN, openTime?: BN, extendMintAccount?: PublicKey[]): Promise<TransactionInstruction>;
    static openPositionFromLiquidityInstruction(programId: PublicKey, payer: PublicKey, poolId: PublicKey, positionNftOwner: PublicKey, positionNftMint: PublicKey, positionNftAccount: PublicKey, metadataAccount: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, personalPosition: PublicKey, ownerTokenAccountA: PublicKey, ownerTokenAccountB: PublicKey, tokenVaultA: PublicKey, tokenVaultB: PublicKey, tokenMintA: PublicKey, tokenMintB: PublicKey, tickLowerIndex: number, tickUpperIndex: number, tickArrayLowerStartIndex: number, tickArrayUpperStartIndex: number, liquidity: BN, amountMaxA: BN, amountMaxB: BN, withMetadata: 'create' | 'no-create', exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static openPositionFromLiquidityInstruction22(programId: PublicKey, payer: PublicKey, poolId: PublicKey, positionNftOwner: PublicKey, positionNftMint: PublicKey, positionNftAccount: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, personalPosition: PublicKey, ownerTokenAccountA: PublicKey, ownerTokenAccountB: PublicKey, tokenVaultA: PublicKey, tokenVaultB: PublicKey, tokenMintA: PublicKey, tokenMintB: PublicKey, tickLowerIndex: number, tickUpperIndex: number, tickArrayLowerStartIndex: number, tickArrayUpperStartIndex: number, liquidity: BN, amountMaxA: BN, amountMaxB: BN, withMetadata: 'create' | 'no-create', exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static openPositionFromBaseInstruction(programId: PublicKey, payer: PublicKey, poolId: PublicKey, positionNftOwner: PublicKey, positionNftMint: PublicKey, positionNftAccount: PublicKey, metadataAccount: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, personalPosition: PublicKey, ownerTokenAccountA: PublicKey, ownerTokenAccountB: PublicKey, tokenVaultA: PublicKey, tokenVaultB: PublicKey, tokenMintA: PublicKey, tokenMintB: PublicKey, tickLowerIndex: number, tickUpperIndex: number, tickArrayLowerStartIndex: number, tickArrayUpperStartIndex: number, withMetadata: 'create' | 'no-create', base: 'MintA' | 'MintB', baseAmount: BN, otherAmountMax: BN, exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static openPositionFromBaseInstruction22(programId: PublicKey, payer: PublicKey, poolId: PublicKey, positionNftOwner: PublicKey, positionNftMint: PublicKey, positionNftAccount: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, personalPosition: PublicKey, ownerTokenAccountA: PublicKey, ownerTokenAccountB: PublicKey, tokenVaultA: PublicKey, tokenVaultB: PublicKey, tokenMintA: PublicKey, tokenMintB: PublicKey, tickLowerIndex: number, tickUpperIndex: number, tickArrayLowerStartIndex: number, tickArrayUpperStartIndex: number, withMetadata: 'create' | 'no-create', base: 'MintA' | 'MintB', baseAmount: BN, otherAmountMax: BN, exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static closePositionInstruction(programId: PublicKey, positionNftOwner: PublicKey, positionNftMint: PublicKey, positionNftAccount: PublicKey, nft2022?: boolean): Promise<TransactionInstruction>;
    static increasePositionFromLiquidityInstruction(programId: PublicKey, positionNftOwner: PublicKey, positionNftAccount: PublicKey, personalPosition: PublicKey, poolId: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, ownerTokenAccountA: PublicKey, ownerTokenAccountB: PublicKey, mintVaultA: PublicKey, mintVaultB: PublicKey, mintMintA: PublicKey, mintMintB: PublicKey, liquidity: BN, amountMaxA: BN, amountMaxB: BN, exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static increasePositionFromBaseInstruction(programId: PublicKey, positionNftOwner: PublicKey, positionNftAccount: PublicKey, personalPosition: PublicKey, poolId: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, ownerTokenAccountA: PublicKey, ownerTokenAccountB: PublicKey, mintVaultA: PublicKey, mintVaultB: PublicKey, mintMintA: PublicKey, mintMintB: PublicKey, base: 'MintA' | 'MintB', baseAmount: BN, otherAmountMax: BN, exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static decreaseLiquidityInstruction(programId: PublicKey, positionNftOwner: PublicKey, positionNftAccount: PublicKey, personalPosition: PublicKey, poolId: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, ownerTokenAccountA: PublicKey, ownerTokenAccountB: PublicKey, mintVaultA: PublicKey, mintVaultB: PublicKey, mintMintA: PublicKey, mintMintB: PublicKey, rewardAccounts: {
        poolRewardVault: PublicKey;
        ownerRewardVault: PublicKey;
        rewardMint: PublicKey;
    }[], liquidity: BN, amountMinA: BN, amountMinB: BN, exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static swapInstruction(programId: PublicKey, payer: PublicKey, poolId: PublicKey, ammConfigId: PublicKey, inputTokenAccount: PublicKey, outputTokenAccount: PublicKey, inputVault: PublicKey, outputVault: PublicKey, inputMint: PublicKey, outputMint: PublicKey, tickArray: PublicKey[], observationId: PublicKey, amount: BN, otherAmountThreshold: BN, sqrtPriceLimitX64: BN, isBaseInput: boolean, exTickArrayBitmap?: PublicKey): Promise<TransactionInstruction>;
    static initRewardInstruction(programId: PublicKey, rewardFunder: PublicKey, funderTokenAccount: PublicKey, ammConfigId: PublicKey, poolId: PublicKey, rewardMint: PublicKey, rewardProgramId: PublicKey, openTime: number, endTime: number, emissionsPerSecondX64: BN): Promise<TransactionInstruction>;
    static setRewardInstruction(programId: PublicKey, authority: PublicKey, ammConfigId: PublicKey, poolId: PublicKey, rewardIndex: number, emissionsPerSecondX64: BN, openTime: number, endTime: number): Promise<TransactionInstruction>;
    static collectRewardInstruction(programId: PublicKey, rewardFunder: PublicKey, funderTokenAccount: PublicKey, poolId: PublicKey, rewardVault: PublicKey, rewardMint: PublicKey, rewardIndex: number): Promise<TransactionInstruction>;
    static createAmmConfigInstruction(programId: PublicKey, owner: PublicKey, ammConfigId: PublicKey, index: number, tickSpacing: number, tradeFeeRate: number, protocolFeeRate: number, fundFeeRate: number): Promise<TransactionInstruction>;
    static updateAmmConfigInstruction(programId: PublicKey, ammConfigId: PublicKey, owner: PublicKey, param: number, value: number): Promise<TransactionInstruction>;
    static updatePoolStatusInstruction(programId: PublicKey, authority: PublicKey, poolState: PublicKey, status: number): Promise<TransactionInstruction>;
    static createSupportMintAssociatedInstruction(programId: PublicKey, owner: PublicKey, tokenMint: PublicKey): Promise<TransactionInstruction>;
    static createOperationAccountInstruction(programId: PublicKey, owner: PublicKey): Promise<TransactionInstruction>;
    static updateOperationAccountInstruction(programId: PublicKey, owner: PublicKey, param: number, keys: PublicKey[]): Promise<TransactionInstruction>;
    static transferRewardOwnerInstruction(programId: PublicKey, authority: PublicKey, poolState: PublicKey, newOwner: PublicKey): Promise<TransactionInstruction>;
    static updateRewardInfosInstruction(programId: PublicKey, poolState: PublicKey): Promise<TransactionInstruction>;
    static collectProtocolFeeInstruction(programId: PublicKey, poolState: PublicKey, tokenVault0: PublicKey, tokenVault1: PublicKey, vault0Mint: PublicKey, vault1Mint: PublicKey, amount0Requested: BN, amount1Requested: BN): Promise<TransactionInstruction>;
    static collectFundFeeInstruction(programId: PublicKey, poolState: PublicKey, tokenVault0: PublicKey, tokenVault1: PublicKey, vault0Mint: PublicKey, vault1Mint: PublicKey, amount0Requested: BN, amount1Requested: BN): Promise<TransactionInstruction>;
    static _legacy_openPosition(programId: PublicKey, payer: PublicKey, positionNftOwner: PublicKey, positionNftMint: PublicKey, positionNftAccount: PublicKey, metadataAccount: PublicKey, poolState: PublicKey, protocolPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, personalPosition: PublicKey, tokenAccount0: PublicKey, tokenAccount1: PublicKey, tokenVault0: PublicKey, tokenVault1: PublicKey, tickLowerIndex: number, tickUpperIndex: number, tickArrayLowerStartIndex: number, tickArrayUpperStartIndex: number, liquidity: BN, amount0Max: BN, amount1Max: BN, remainingAccounts?: {
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }[]): Promise<TransactionInstruction>;
    static _legacy_increaseLiquidity(programId: PublicKey, nftOwner: PublicKey, nftAccount: PublicKey, poolState: PublicKey, protocolPosition: PublicKey, personalPosition: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, tokenAccount0: PublicKey, tokenAccount1: PublicKey, tokenVault0: PublicKey, tokenVault1: PublicKey, liquidity: BN, amount0Max: BN, amount1Max: BN, remainingAccounts?: {
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }[]): Promise<TransactionInstruction>;
    static _legacy_decreaseLiquidity(programId: PublicKey, nftOwner: PublicKey, nftAccount: PublicKey, personalPosition: PublicKey, poolState: PublicKey, protocolPosition: PublicKey, tokenVaultA: PublicKey, tokenVaultB: PublicKey, tickArrayLower: PublicKey, tickArrayUpper: PublicKey, recipientTokenAccountA: PublicKey, recipientTokenAccountB: PublicKey, liquidity: BN, amountAMin: BN, amountBMin: BN, remainingAccounts?: {
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }[]): Promise<TransactionInstruction>;
    static _legacy_swap(programId: PublicKey, payer: PublicKey, ammConfig: PublicKey, poolState: PublicKey, inputTokenAccount: PublicKey, outputTokenAccount: PublicKey, inputVault: PublicKey, outputVault: PublicKey, observationState: PublicKey, tickArray: PublicKey[], amount: BN, otherAmountThreshold: BN, sqrtPriceLimitX64: BN, isBaseInput: boolean, remainingAccounts?: {
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }[]): Promise<TransactionInstruction>;
    static initAmmAdminGroupInstruction(programId: PublicKey, params: {
        feeKeeper: PublicKey;
        rewardConfigManager: PublicKey;
        rewardClaimManager: PublicKey;
        poolManager: PublicKey;
        emergencyManager: PublicKey;
        normalManager: PublicKey;
    }): Promise<TransactionInstruction>;
    static updateAmmAdminGroupInstruction(programId: PublicKey, params: {
        feeKeeper?: PublicKey;
        rewardConfigManager?: PublicKey;
        rewardClaimManager?: PublicKey;
        poolManager?: PublicKey;
        emergencyManager?: PublicKey;
        normalManager?: PublicKey;
    }): Promise<TransactionInstruction>;
    static depositOffchainRewardInstruction(programId: PublicKey, poolId: PublicKey, payer: PublicKey, authority: PublicKey, tokenMint: PublicKey, payerTokenAccount: PublicKey, tokenProgram: PublicKey, amount: BN): Promise<TransactionInstruction>;
    static claimOffchainRewardInstruction(programId: PublicKey, poolId: PublicKey, claimer: PublicKey, authority: PublicKey, tokenMint: PublicKey, claimerTokenAccount: PublicKey, tokenProgram: PublicKey, amount: BN): Promise<TransactionInstruction>;
    static withdrawOffchainRewardInstruction(programId: PublicKey, poolId: PublicKey, authority: PublicKey, tokenMint: PublicKey, receiverTokenAccount: PublicKey, tokenProgram: PublicKey, amount: BN): Promise<TransactionInstruction>;
}
