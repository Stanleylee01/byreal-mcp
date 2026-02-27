import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TickArrayContainer, TickArrayBitmapExtensionType } from './models.js';
export declare abstract class SwapMath {
    /**
     * Calculate swap path and output amount
     *
     * @param programId - Public key address of the CLMM program
     * @param poolId - Public key address of the liquidity pool
     * @param tickArrayCache - Tick array cache with keys as tick array start indices
     * @param tickArrayBitmap - Tick array bitmap for quickly finding initialized ticks
     * @param tickarrayBitmapExtension - Tick array bitmap extension information
     * @param zeroForOne - Swap direction: true means token0 to token1, false means token1 to token0
     * @param fee - Transaction fee rate (base 1000000)
     * @param liquidity - Current liquidity amount
     * @param currentTick - Current tick position
     * @param tickSpacing - Tick spacing
     * @param currentSqrtPriceX64 - Square root of current price (Q64.64 format)
     * @param amountSpecified - Specified swap amount (positive for input amount, negative for output amount)
     * @param lastSavedTickArrayStartIndex - Last saved tick array start index
     * @param sqrtPriceLimitX64 - Square root of price limit (Q64.64 format), optional parameter
     * @param catchLiquidityInsufficient - Whether to catch liquidity insufficient errors, default false
     *
     * @returns Swap calculation result object
     * @returns allTrade - Whether all trades were completed
     * @returns amountSpecifiedRemaining - Remaining untraded amount
     * @returns amountCalculated - Calculated amount of the other token
     * @returns feeAmount - Total fees
     * @returns sqrtPriceX64 - Square root of price after swap (Q64.64 format)
     * @returns liquidity - Liquidity after swap
     * @returns tickCurrent - Tick position after swap
     * @returns accounts - List of tick array accounts that need to be accessed
     */
    static swapCompute(programId: PublicKey, poolId: PublicKey, tickArrayInfo: {
        [key: string]: TickArrayContainer;
    }, tickArrayBitmap: BN[], tickarrayBitmapExtension: TickArrayBitmapExtensionType, zeroForOne: boolean, fee: number, liquidity: BN, currentTick: number, tickSpacing: number, currentSqrtPriceX64: BN, amountSpecified: BN, lastSavedTickArrayStartIndex: number, sqrtPriceLimitX64?: BN, catchLiquidityInsufficient?: boolean): {
        allTrade: boolean;
        amountSpecifiedRemaining: BN;
        amountCalculated: BN;
        feeAmount: BN;
        sqrtPriceX64: BN;
        liquidity: BN;
        tickCurrent: number;
        accounts: PublicKey[];
    };
    private static swapStepCompute;
}
