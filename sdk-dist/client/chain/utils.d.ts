import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { IPoolLayout, IPoolLayoutWithId } from '../../instructions/index.js';
import { Connection, PublicKey } from '@solana/web3.js';
/**
 * Used to round the price to the corresponding tick when creating a position
 * @param price Input price
 * @param poolInfo Pool information
 * @returns Decimal rounded price
 */
export declare function alignPriceToTickPrice(price: Decimal, poolInfo: IPoolLayout): Decimal;
/**
 * Calculate the amount of tokenB needed to be invested after the specified tokenA amount has been invested
 * @param params.priceLower Lower price
 * @param params.priceUpper Upper price
 * @param params.amountA Amount of tokenA to be invested
 * @param params.poolInfo Pool information
 * @returns BN amount of tokenB to be invested
 */
export declare function getAmountBFromAmountA(params: {
    priceLower: Decimal | number | string;
    priceUpper: Decimal | number | string;
    amountA: BN;
    poolInfo: IPoolLayout;
}): BN;
/**
 * Calculate the amount of tokenA needed to be invested after the specified tokenB amount has been invested
 * @param params.priceLower Lower price
 * @param params.priceUpper Upper price
 * @param params.amountB Amount of tokenB to be invested
 * @param params.poolInfo Pool information
 * @returns BN amount of tokenA to be invested
 */
export declare function getAmountAFromAmountB(params: {
    priceLower: Decimal | number | string;
    priceUpper: Decimal | number | string;
    amountB: BN;
    poolInfo: IPoolLayout;
}): BN;
/**
 * Calculate the expected annualized return rate of adding liquidity (APR)
 */
export declare function calculateApr(params: {
    volume24h: number;
    feeRate: number;
    positionUsdValue: number;
    amountA: BN;
    amountB: BN;
    tickLower: number;
    tickUpper: number;
    poolInfo: IPoolLayoutWithId;
    existLiquidity?: BN;
    scene?: 'create' | 'add' | 'exist';
}): number;
/**
 * Calculate the expected annualized return rate of reward
 */
export declare function calculateRewardApr(params: {
    reward24hUsdValue: number;
    positionUsdValue: number;
    amountA: BN;
    amountB: BN;
    tickLower: number;
    tickUpper: number;
    poolInfo: IPoolLayoutWithId;
    existLiquidity?: BN;
    scene?: 'create' | 'add' | 'exist';
}): number;
/**
 * Calculate the expected annualized return rate of adding liquidity (APR)
 *
 */
export declare function _calculateApr(params: {
    fee24hUsdValue: number;
    positionUsdValue: number;
    amountA: BN;
    amountB: BN;
    tickLower: number;
    tickUpper: number;
    poolInfo: IPoolLayoutWithId;
    existLiquidity?: BN;
    scene?: 'create' | 'add' | 'exist';
}): number;
/**
 * Calculate the annualized return rate for different price ranges
 * Calculate APR for different price ranges based on the percentage offset from the current price
 *
 * @param params Calculation parameters
 * @returns Mapping of annualized return rates for different price ranges, using -1 to represent the full range
 */
export declare function calculateRangeAprs(params: {
    percentRanges: number[];
    volume24h: number;
    feeRate: number;
    tokenAPriceUsd: number;
    tokenBPriceUsd: number;
    poolInfo: IPoolLayoutWithId;
}): Record<number, number>;
/**
 * 获取 mint 对应的 token program ID
 */
export declare function getTokenProgramId(connection: Connection, mintAddress: PublicKey): Promise<PublicKey>;
