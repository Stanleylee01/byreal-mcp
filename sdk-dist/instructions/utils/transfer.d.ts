import { EpochInfo } from '@solana/web3.js';
import BN from 'bn.js';
import { TransferFeeDataBaseType, IGetTransferAmountFee } from '../models.js';
export declare function getTransferAmountFee(amount: BN, _feeConfig: TransferFeeDataBaseType | undefined, epochInfo: EpochInfo, addFee: boolean): IGetTransferAmountFee;
export declare function minExpirationTime(expirationTime1: number | undefined, expirationTime2: number | undefined): number | undefined;
export declare function BNDivCeil(bn1: BN, bn2: BN): BN;
