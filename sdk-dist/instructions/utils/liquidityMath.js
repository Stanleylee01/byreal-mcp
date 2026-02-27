import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { MaxU64, ONE, Q64, U64Resolution, ZERO } from '../constants.js';
import { MathUtils } from './mathUtils.js';
export class LiquidityMath {
    static addDelta(x, y) {
        return x.add(y);
    }
    static getTokenAmountAFromLiquidity(sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp) {
        if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
            [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
        }
        if (!sqrtPriceX64A.gt(ZERO)) {
            throw new Error('sqrtPriceX64A must greater than 0');
        }
        const numerator1 = liquidity.ushln(U64Resolution);
        const numerator2 = sqrtPriceX64B.sub(sqrtPriceX64A);
        return roundUp
            ? MathUtils.mulDivRoundingUp(MathUtils.mulDivCeil(numerator1, numerator2, sqrtPriceX64B), ONE, sqrtPriceX64A)
            : MathUtils.mulDivFloor(numerator1, numerator2, sqrtPriceX64B).div(sqrtPriceX64A);
    }
    static getTokenAmountBFromLiquidity(sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp) {
        if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
            [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
        }
        if (!sqrtPriceX64A.gt(ZERO)) {
            throw new Error('sqrtPriceX64A must greater than 0');
        }
        return roundUp
            ? MathUtils.mulDivCeil(liquidity, sqrtPriceX64B.sub(sqrtPriceX64A), Q64)
            : MathUtils.mulDivFloor(liquidity, sqrtPriceX64B.sub(sqrtPriceX64A), Q64);
    }
    static getLiquidityFromTokenAmountA(sqrtPriceX64A, sqrtPriceX64B, amountA, roundUp) {
        if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
            [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
        }
        const numerator = amountA.mul(sqrtPriceX64A).mul(sqrtPriceX64B);
        const denominator = sqrtPriceX64B.sub(sqrtPriceX64A);
        const result = numerator.div(denominator);
        if (roundUp) {
            return MathUtils.mulDivRoundingUp(result, ONE, MaxU64);
        }
        else {
            return result.shrn(U64Resolution);
        }
    }
    static getLiquidityFromTokenAmountB(sqrtPriceX64A, sqrtPriceX64B, amountB) {
        if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
            [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
        }
        return MathUtils.mulDivFloor(amountB, MaxU64, sqrtPriceX64B.sub(sqrtPriceX64A));
    }
    static getLiquidityFromTokenAmounts(sqrtPriceCurrentX64, sqrtPriceX64A, sqrtPriceX64B, amountA, amountB) {
        if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
            [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
        }
        if (sqrtPriceCurrentX64.lte(sqrtPriceX64A)) {
            return LiquidityMath.getLiquidityFromTokenAmountA(sqrtPriceX64A, sqrtPriceX64B, amountA, false);
        }
        else if (sqrtPriceCurrentX64.lt(sqrtPriceX64B)) {
            const liquidity0 = LiquidityMath.getLiquidityFromTokenAmountA(sqrtPriceCurrentX64, sqrtPriceX64B, amountA, false);
            const liquidity1 = LiquidityMath.getLiquidityFromTokenAmountB(sqrtPriceX64A, sqrtPriceCurrentX64, amountB);
            return liquidity0.lt(liquidity1) ? liquidity0 : liquidity1;
        }
        else {
            return LiquidityMath.getLiquidityFromTokenAmountB(sqrtPriceX64A, sqrtPriceX64B, amountB);
        }
    }
    static getAmountsFromLiquidity(sqrtPriceCurrentX64, sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp) {
        if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
            [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
        }
        if (sqrtPriceCurrentX64.lte(sqrtPriceX64A)) {
            return {
                amountA: LiquidityMath.getTokenAmountAFromLiquidity(sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp),
                amountB: new BN(0),
            };
        }
        else if (sqrtPriceCurrentX64.lt(sqrtPriceX64B)) {
            const amountA = LiquidityMath.getTokenAmountAFromLiquidity(sqrtPriceCurrentX64, sqrtPriceX64B, liquidity, roundUp);
            const amountB = LiquidityMath.getTokenAmountBFromLiquidity(sqrtPriceX64A, sqrtPriceCurrentX64, liquidity, roundUp);
            return { amountA, amountB };
        }
        else {
            return {
                amountA: new BN(0),
                amountB: LiquidityMath.getTokenAmountBFromLiquidity(sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp),
            };
        }
    }
    static getAmountsFromLiquidityWithSlippage(sqrtPriceCurrentX64, sqrtPriceX64A, sqrtPriceX64B, liquidity, amountMax, roundUp, amountSlippage) {
        const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(sqrtPriceCurrentX64, sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp);
        const coefficient = amountMax ? 1 + amountSlippage : 1 - amountSlippage;
        const amount0Slippage = new BN(new Decimal(amountA.toString()).mul(coefficient).toFixed(0));
        const amount1Slippage = new BN(new Decimal(amountB.toString()).mul(coefficient).toFixed(0));
        return {
            amountSlippageA: amount0Slippage,
            amountSlippageB: amount1Slippage,
        };
    }
    /**
     * Given a price range, calculate the required tokenB amount after investing a specified tokenA amount
     *
     * Similar implementation in raydium: getLiquidityAmountOutFromAmountIn
     */
    static getAmountBFromAmountA(startSqrtPriceX64, endSqrtPriceX64, currentSqrtPriceX64, amountA) {
        if (startSqrtPriceX64.gt(endSqrtPriceX64)) {
            [startSqrtPriceX64, endSqrtPriceX64] = [endSqrtPriceX64, startSqrtPriceX64];
        }
        if (currentSqrtPriceX64.lte(startSqrtPriceX64)) {
            return new BN(0);
        }
        if (currentSqrtPriceX64.gt(endSqrtPriceX64)) {
            return new BN(0);
        }
        const liquidity = LiquidityMath.getLiquidityFromTokenAmountA(currentSqrtPriceX64, endSqrtPriceX64, amountA, false);
        return LiquidityMath.getTokenAmountBFromLiquidity(startSqrtPriceX64, currentSqrtPriceX64, liquidity, true);
    }
    /**
     * Given a price range, calculate the required tokenA amount after investing a specified tokenB amount
     *
     * Similar implementation in raydium: getLiquidityAmountOutFromAmountIn
     */
    static getAmountAFromAmountB(startSqrtPriceX64, endSqrtPriceX64, currentSqrtPriceX64, amountB) {
        if (startSqrtPriceX64.gt(endSqrtPriceX64)) {
            [startSqrtPriceX64, endSqrtPriceX64] = [endSqrtPriceX64, startSqrtPriceX64];
        }
        if (currentSqrtPriceX64.lte(startSqrtPriceX64)) {
            return new BN(0);
        }
        if (currentSqrtPriceX64.gt(endSqrtPriceX64)) {
            return new BN(0);
        }
        const liquidity = LiquidityMath.getLiquidityFromTokenAmountB(startSqrtPriceX64, currentSqrtPriceX64, amountB);
        return LiquidityMath.getTokenAmountAFromLiquidity(currentSqrtPriceX64, endSqrtPriceX64, liquidity, true);
    }
}
