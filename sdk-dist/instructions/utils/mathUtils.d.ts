import BN from 'bn.js';
import { Decimal } from 'decimal.js';
export declare class MathUtils {
    static mulDivRoundingUp(a: BN, b: BN, denominator: BN): BN;
    static mulDivFloor(a: BN, b: BN, denominator: BN): BN;
    static mulDivCeil(a: BN, b: BN, denominator: BN): BN;
    static x64ToDecimal(num: BN, decimalPlaces?: number): Decimal;
    static decimalToX64(num: Decimal): BN;
    static wrappingSubU128(n0: BN, n1: BN): BN;
}
