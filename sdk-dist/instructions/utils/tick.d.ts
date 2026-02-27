import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { IPoolLayout } from '../layout.js';
import { TickArrayBitmapExtensionType } from '../models.js';
import { ReturnTypeGetPriceAndTick, Tick, TickArrayState, TickState, TickArrayContainer } from './models.js';
export declare class TickUtils {
    static getTickArrayAddressByTick(programId: PublicKey, poolId: PublicKey, tickIndex: number, tickSpacing: number): PublicKey;
    static getTickOffsetInArray(tickIndex: number, tickSpacing: number): number;
    static getTickArrayBitIndex(tickIndex: number, tickSpacing: number): number;
    static getTickArrayStartIndexByTick(tickIndex: number, tickSpacing: number): number;
    static getTickArrayOffsetInBitmapByTick(tick: number, tickSpacing: number): number;
    static checkTickArrayIsInitialized(bitmap: BN, tick: number, tickSpacing: number): {
        isInitialized: boolean;
        startIndex: number;
    };
    static getNextTickArrayStartIndex(lastTickArrayStartIndex: number, tickSpacing: number, zeroForOne: boolean): number;
    static mergeTickArrayBitmap(bns: BN[]): BN;
    /**
     * Search for initialized TickArrays around the current position to find the starting indices of a specified number of initialized TickArrays
     *
     * @param tickArrayBitmap - Main tick array bitmap used to mark initialized tick arrays
     * @param exTickArrayBitmap - Extended tick array bitmap containing positive and negative direction extension bitmap information
     * @param tickSpacing - Tick spacing
     * @param tickArrayStartIndex - Starting tick array index for the search
     * @param expectedCount - Expected number of initialized TickArrays to find
     *
     * @returns Array of initialized TickArray starting indices
     *
     * @description
     * This function is used to locate active liquidity around the current price. It searches on both sides of the given starting position:
     * - Search right (higher tick positions)
     * - Search left (lower tick positions)
     * By combining the search results from both directions, it provides the liquidity distribution around the current price
     */
    static getInitializedTickArrayInRange(tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtensionType, tickSpacing: number, tickArrayStartIndex: number, expectedCount: number): number[];
    static getAllInitializedTickArrayStartIndex(tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtensionType, tickSpacing: number): number[];
    static getAllInitializedTickArrayInfo(programId: PublicKey, poolId: PublicKey, tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtensionType, tickSpacing: number): {
        tickArrayStartIndex: number;
        tickArrayAddress: PublicKey;
    }[];
    static getAllInitializedTickInTickArray(tickArray: TickArrayState): TickState[];
    /**
     * Search for initialized TickArrays to the left from the starting position
     * Used to locate active liquidity near the current price
     */
    static searchLowBitFromStart(tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtensionType, currentTickArrayBitStartIndex: number, expectedCount: number, tickSpacing: number): number[];
    /**
     * Search for initialized TickArrays to the right from the starting position
     * Used to locate active liquidity near the current price
     */
    static searchHightBitFromStart(tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtensionType, currentTickArrayBitStartIndex: number, expectedCount: number, tickSpacing: number): number[];
    static checkIsOutOfBoundary(tick: number): boolean;
    /**
     * Get the next initialized Tick
     * Used to locate active liquidity near the current price
     * Now supports both fixed and dynamic tick arrays through the container pattern
     */
    static nextInitTick(tickArrayCurrent: TickArrayContainer, currentTickIndex: number, tickSpacing: number, zeroForOne: boolean, t: boolean): Tick | null;
    /**
     * Fixed tick array implementation (original logic)
     */
    private static _nextInitTickFixed;
    /**
     * Dynamic tick array implementation
     * Uses the mapping table (tickOffsetIndex) to find allocated ticks
     */
    private static _nextInitTickDynamic;
    /**
     * Find the first initialized Tick in the given TickArray, where "first" is defined based on the trading direction (zeroForOne)
     * Now supports both fixed and dynamic tick arrays through the container pattern
     */
    static firstInitializedTick(tickArrayCurrent: TickArrayContainer, zeroForOne: boolean): Tick;
    /**
     * Fixed tick array implementation (original logic)
     */
    private static _firstInitializedTickFixed;
    /**
     * Dynamic tick array implementation
     * Uses the mapping table (tickOffsetIndex) to find the first allocated tick
     */
    private static _firstInitializedTickDynamic;
    static getPriceAndTick({ poolInfo, price, baseIn, }: {
        poolInfo: IPoolLayout;
        price: Decimal;
        baseIn: boolean;
    }): ReturnTypeGetPriceAndTick;
}
export declare type PoolVars = {
    key: PublicKey;
    tokenA: PublicKey;
    tokenB: PublicKey;
    fee: number;
};
export declare class TickQuery {
    /**
     * Find the next initialized TickArray
     */
    static nextInitializedTickArray(tickIndex: number, tickSpacing: number, zeroForOne: boolean, tickArrayBitmap: BN[], exBitmapInfo: TickArrayBitmapExtensionType): {
        isExist: boolean;
        nextStartIndex: number;
    };
    static getArrayStartIndex(tickIndex: number, tickSpacing: number): number;
    static checkIsValidStartIndex(tickIndex: number, tickSpacing: number): boolean;
    static tickCount(tickSpacing: number): number;
}
