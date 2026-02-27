import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { ONE, Q128, ZERO } from '../constants.js';
export class MathUtils {
    static mulDivRoundingUp(a, b, denominator) {
        const numerator = a.mul(b);
        let result = numerator.div(denominator);
        if (!numerator.mod(denominator).eq(ZERO)) {
            result = result.add(ONE);
        }
        return result;
    }
    static mulDivFloor(a, b, denominator) {
        if (denominator.eq(ZERO)) {
            throw new Error('division by 0');
        }
        return a.mul(b).div(denominator);
    }
    static mulDivCeil(a, b, denominator) {
        if (denominator.eq(ZERO)) {
            throw new Error('division by 0');
        }
        const numerator = a.mul(b).add(denominator.sub(ONE));
        return numerator.div(denominator);
    }
    static x64ToDecimal(num, decimalPlaces) {
        return new Decimal(num.toString()).div(Decimal.pow(2, 64)).toDecimalPlaces(decimalPlaces);
    }
    static decimalToX64(num) {
        return new BN(num.mul(Decimal.pow(2, 64)).floor().toFixed());
    }
    static wrappingSubU128(n0, n1) {
        return n0.add(Q128).sub(n1).mod(Q128);
    }
}
