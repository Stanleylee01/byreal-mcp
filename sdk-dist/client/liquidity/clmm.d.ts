import { PublicKey } from '@solana/web3.js';
import { Chain } from '../chain/index.js';
import { IAddLiquidityParams } from '../chain/models.js';
import { AbstractLiquidityClient } from './abstract.js';
import { ICLMMCreatePositionOptions } from './types.js';
export declare class CLMMClient extends AbstractLiquidityClient {
    constructor(params: {
        chain: Chain;
    });
    /**
     * Create a position
     * @param options
     * @returns
     */
    createPosition(options: ICLMMCreatePositionOptions): Promise<import("../index.js").IInstructionReturn>;
    addLiquidity(options: IAddLiquidityParams): Promise<import("../index.js").IInstructionReturn>;
    /**
     * Decrease liquidity
     * @param nftMint
     * @returns
     */
    decreaseLiquidity(walletAddress: PublicKey, nftMint: string, decreasePercentage: number): Promise<import("@solana/web3.js").VersionedTransaction>;
    /**
     * Remove all liquidity
     * @param userAddress
     * @param nftMint
     */
    removeFullLiquidity(userAddress: string, nftMint: string): Promise<import("@solana/web3.js").VersionedTransaction>;
}
