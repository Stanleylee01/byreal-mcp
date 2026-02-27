import { Connection, PublicKey } from '@solana/web3.js';
import { TickArrayBitmapExtensionType } from './models';
/**
 * @description Get the tick array bitmap extension
 *
 */
export declare function getTickArrayBitmapExtension(programId: PublicKey, poolId: PublicKey, connection: Connection): Promise<TickArrayBitmapExtensionType>;
