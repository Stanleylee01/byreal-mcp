import { Connection } from '@solana/web3.js';
import { IPoolLayoutWithId, TickArrayBitmapExtensionType } from '../models.js';
import { TickArrayContainer } from './models';
/**
 * Get tick array cache
 * Now returns TickArrayContainer which supports both fixed and dynamic tick arrays
 */
export declare function getTickArrayInfo({ connection, poolInfo, exBitmapInfo, expectedCount, }: {
    connection: Connection;
    poolInfo: IPoolLayoutWithId;
    exBitmapInfo: TickArrayBitmapExtensionType;
    expectedCount?: number;
}): Promise<{
    [key: string]: TickArrayContainer;
}>;
