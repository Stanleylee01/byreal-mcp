import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { IPoolLayout } from './layout.js';
export interface IGetTransferAmountFee {
    amount: BN;
    fee: BN | undefined;
    expirationTime: number | undefined;
}
export interface TickArrayBitmapExtensionType {
    poolId: PublicKey;
    positiveTickArrayBitmap: BN[][];
    negativeTickArrayBitmap: BN[][];
}
export interface TransferFeeDataBaseType {
    transferFeeConfigAuthority: string;
    withdrawWithheldAuthority: string;
    withheldAmount: string;
    olderTransferFee: {
        epoch: string;
        maximumFee: string;
        transferFeeBasisPoints: number;
    };
    newerTransferFee: {
        epoch: string;
        maximumFee: string;
        transferFeeBasisPoints: number;
    };
}
export interface ITokenInfo {
    decimals: number;
    address: string;
    programId: string;
}
export type IPoolLayoutWithId = IPoolLayout & {
    currentPrice: number;
    programId: PublicKey;
    poolId: PublicKey;
};
export interface IAccountInfo {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
}
