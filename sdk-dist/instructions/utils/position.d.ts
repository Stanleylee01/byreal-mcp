import { EpochInfo } from '@solana/web3.js';
import BN from 'bn.js';
import { IPersonalPositionLayout, IPoolLayout } from '../layout.js';
import { Tick } from './models.js';
export interface GetTransferAmountFee {
    amount: BN;
    fee: BN | undefined;
    expirationTime: number | undefined;
}
export interface ReturnTypeGetLiquidityAmountOut {
    liquidity: BN;
    amountSlippageA: GetTransferAmountFee;
    amountSlippageB: GetTransferAmountFee;
    amountA: GetTransferAmountFee;
    amountB: GetTransferAmountFee;
    expirationTime: number | undefined;
}
export declare class PositionUtils {
    static getfeeGrowthInside(poolInfo: Pick<IPoolLayout, 'tickCurrent' | 'feeGrowthGlobalX64A' | 'feeGrowthGlobalX64B'>, tickLowerState: Tick, tickUpperState: Tick): {
        feeGrowthInsideX64A: BN;
        feeGrowthInsideBX64: BN;
    };
    static getPositionFees(poolInfo: Pick<IPoolLayout, 'tickCurrent' | 'feeGrowthGlobalX64A' | 'feeGrowthGlobalX64B'>, positionState: IPersonalPositionLayout, tickLowerState: Tick, tickUpperState: Tick): {
        tokenFeeAmountA: BN;
        tokenFeeAmountB: BN;
    };
    static getAmountsFromLiquidity(params: {
        poolInfo: IPoolLayout;
        ownerPosition: IPersonalPositionLayout;
        liquidity: BN;
        slippage: number;
        add: boolean;
        epochInfo: EpochInfo;
    }): ReturnTypeGetLiquidityAmountOut;
}
