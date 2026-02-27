import BN from 'bn.js';
export declare class LiquidityMath {
    static addDelta(x: BN, y: BN): BN;
    static getTokenAmountAFromLiquidity(sqrtPriceX64A: BN, sqrtPriceX64B: BN, liquidity: BN, roundUp: boolean): BN;
    static getTokenAmountBFromLiquidity(sqrtPriceX64A: BN, sqrtPriceX64B: BN, liquidity: BN, roundUp: boolean): BN;
    static getLiquidityFromTokenAmountA(sqrtPriceX64A: BN, sqrtPriceX64B: BN, amountA: BN, roundUp: boolean): BN;
    static getLiquidityFromTokenAmountB(sqrtPriceX64A: BN, sqrtPriceX64B: BN, amountB: BN): BN;
    static getLiquidityFromTokenAmounts(sqrtPriceCurrentX64: BN, sqrtPriceX64A: BN, sqrtPriceX64B: BN, amountA: BN, amountB: BN): BN;
    static getAmountsFromLiquidity(sqrtPriceCurrentX64: BN, sqrtPriceX64A: BN, sqrtPriceX64B: BN, liquidity: BN, roundUp: boolean): {
        amountA: BN;
        amountB: BN;
    };
    static getAmountsFromLiquidityWithSlippage(sqrtPriceCurrentX64: BN, sqrtPriceX64A: BN, sqrtPriceX64B: BN, liquidity: BN, amountMax: boolean, roundUp: boolean, amountSlippage: number): {
        amountSlippageA: BN;
        amountSlippageB: BN;
    };
    /**
     * Given a price range, calculate the required tokenB amount after investing a specified tokenA amount
     *
     * Similar implementation in raydium: getLiquidityAmountOutFromAmountIn
     */
    static getAmountBFromAmountA(startSqrtPriceX64: BN, endSqrtPriceX64: BN, currentSqrtPriceX64: BN, amountA: BN): BN;
    /**
     * Given a price range, calculate the required tokenA amount after investing a specified tokenB amount
     *
     * Similar implementation in raydium: getLiquidityAmountOutFromAmountIn
     */
    static getAmountAFromAmountB(startSqrtPriceX64: BN, endSqrtPriceX64: BN, currentSqrtPriceX64: BN, amountB: BN): BN;
}
