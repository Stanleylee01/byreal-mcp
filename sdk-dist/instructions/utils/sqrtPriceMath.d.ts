import BN from 'bn.js';
import { Decimal } from 'decimal.js';
export declare class SqrtPriceMath {
    static sqrtPriceX64ToPrice(sqrtPriceX64: BN, decimalsA: number, decimalsB: number): Decimal;
    static priceToSqrtPriceX64(price: Decimal, decimalsA: number, decimalsB: number): BN;
    static getNextSqrtPriceX64FromInput(sqrtPriceX64: BN, liquidity: BN, amountIn: BN, zeroForOne: boolean): BN;
    static getNextSqrtPriceX64FromOutput(sqrtPriceX64: BN, liquidity: BN, amountOut: BN, zeroForOne: boolean): BN;
    private static getNextSqrtPriceFromTokenAmountARoundingUp;
    private static getNextSqrtPriceFromTokenAmountBRoundingDown;
    static getSqrtPriceX64FromTick(tick: number): BN;
    static getTickFromPrice(price: Decimal, decimalsA: number, decimalsB: number): number;
    static getTickFromSqrtPriceX64(sqrtPriceX64: BN): number;
}
