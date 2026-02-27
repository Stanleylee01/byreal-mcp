import BN from 'bn.js';
import { Decimal } from 'decimal.js';
export interface TickAlignedPriceDetails {
    tick: number;
    sqrtPriceX64: BN;
    price: Decimal;
}
export declare class TickMath {
    static getTickWithPriceAndTickspacing(price: Decimal, tickSpacing: number, mintDecimalsA: number, mintDecimalsB: number): number;
    static getPriceFromTick(params: {
        tick: number;
        decimalsA: number;
        decimalsB: number;
        baseIn?: boolean;
    }): Decimal;
    static getTickAlignedPriceDetails(price: Decimal, tickSpacing: number, mintDecimalsA: number, mintDecimalsB: number): TickAlignedPriceDetails;
}
