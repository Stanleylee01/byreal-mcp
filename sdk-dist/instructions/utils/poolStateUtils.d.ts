import { Connection, PublicKey } from '@solana/web3.js';
import { IPoolLayout } from '../layout.js';
/**
 * Pool State Utilities for querying pool information with decay fee support
 */
export declare class PoolStateUtils {
    /**
     * Check if the pool has decay fee enabled
     * @param poolInfo Pool layout information
     * @returns boolean indicating if decay fee is enabled
     */
    static isDecayFeeEnabled(poolInfo: IPoolLayout): boolean;
    /**
     * Check if decay fee is enabled for selling mint0
     * @param poolInfo Pool layout information
     * @returns boolean indicating if decay fee is enabled for mint0 sell
     */
    static isDecayFeeOnSellMint0(poolInfo: IPoolLayout): boolean;
    /**
     * Check if decay fee is enabled for selling mint1
     * @param poolInfo Pool layout information
     * @returns boolean indicating if decay fee is enabled for mint1 sell
     */
    static isDecayFeeOnSellMint1(poolInfo: IPoolLayout): boolean;
    /**
     * Calculate the current decay fee rate based on the current time
     * @param poolInfo Pool layout information
     * @param currentTimestamp Current timestamp in seconds
     * @returns Decay fee rate in hundredths of a bip (10^-6)
     */
    static getDecayFeeRate(poolInfo: IPoolLayout, currentTimestamp: number): number;
    /**
     * Get comprehensive decay fee information for a pool
     * @param poolInfo Pool layout information
     * @param currentTimestamp Current timestamp in seconds
     * @returns Object containing all decay fee related information
     */
    static getDecayFeeInfo(poolInfo: IPoolLayout, currentTimestamp?: number): {
        isEnabled: boolean;
        onSellMint0: boolean;
        onSellMint1: boolean;
        initFeeRate: number;
        decreaseRate: number;
        decreaseInterval: number;
        currentFeeRate: number;
        openTime: number;
    };
    /**
     * Get pool state with decay fee information from chain
     * @param connection Solana connection
     * @param poolId Pool address
     * @param currentTimestamp Optional current timestamp
     * @returns Pool information with decay fee details
     */
    static getPoolStateWithDecayFee(connection: Connection, poolId: string | PublicKey, currentTimestamp?: number): Promise<{
        decayFeeInfo: {
            isEnabled: boolean;
            onSellMint0: boolean;
            onSellMint1: boolean;
            initFeeRate: number;
            decreaseRate: number;
            decreaseInterval: number;
            currentFeeRate: number;
            openTime: number;
        };
        ammConfig: PublicKey;
        tickSpacing: number;
        tickArrayBitmap: import("bn.js")[];
        sqrtPriceX64: import("bn.js");
        openTime: import("bn.js");
        liquidity: import("bn.js");
        status: number;
        bump: number;
        recentEpoch: import("bn.js");
        rewardInfos: {
            tokenMint: PublicKey;
            openTime: import("bn.js");
            emissionsPerSecondX64: import("bn.js");
            endTime: import("bn.js");
            rewardState: number;
            lastUpdateTime: import("bn.js");
            rewardTotalEmissioned: import("bn.js");
            rewardClaimed: import("bn.js");
            tokenVault: PublicKey;
            rewardGrowthGlobalX64: import("bn.js");
            creator: PublicKey;
        }[];
        tickCurrent: number;
        padding1: import("bn.js")[];
        padding2: import("bn.js")[];
        creator: PublicKey;
        mintA: PublicKey;
        mintB: PublicKey;
        vaultA: PublicKey;
        vaultB: PublicKey;
        observationId: PublicKey;
        mintDecimalsA: number;
        mintDecimalsB: number;
        feeGrowthGlobalX64A: import("bn.js");
        feeGrowthGlobalX64B: import("bn.js");
        protocolFeesTokenA: import("bn.js");
        protocolFeesTokenB: import("bn.js");
        swapInAmountTokenA: import("bn.js");
        swapOutAmountTokenB: import("bn.js");
        swapInAmountTokenB: import("bn.js");
        swapOutAmountTokenA: import("bn.js");
        totalFeesTokenA: import("bn.js");
        totalFeesClaimedTokenA: import("bn.js");
        totalFeesTokenB: import("bn.js");
        totalFeesClaimedTokenB: import("bn.js");
        fundFeesTokenA: import("bn.js");
        fundFeesTokenB: import("bn.js");
        decayFeeFlag: number;
        decayFeeInitFeeRate: number;
        decayFeeDecreaseRate: number;
        decayFeeDecreaseInterval: number;
        padding1_1: number[];
        currentPrice: number;
        programId: PublicKey;
        poolId: PublicKey;
    }>;
    /**
     * Check if decay fee is currently active for a specific direction
     * @param poolInfo Pool layout information
     * @param zeroForOne True if swapping token0 for token1 (selling token0)
     * @param currentTimestamp Current timestamp in seconds
     * @returns Object with active status and current fee rate
     */
    static getDecayFeeForDirection(poolInfo: IPoolLayout, zeroForOne: boolean, currentTimestamp?: number): {
        isActive: boolean;
        feeRate: number;
    };
}
