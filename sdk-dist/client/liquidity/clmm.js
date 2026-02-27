import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { AbstractLiquidityClient } from './abstract.js';
export class CLMMClient extends AbstractLiquidityClient {
    constructor(params) {
        super(params);
    }
    /**
     * Create a position
     * @param options
     * @returns
     */
    async createPosition(options) {
        return this._chain.createPositionInstructions({
            userAddress: options.walletAddress,
            poolInfo: options.rpcPoolInfo,
            tickLower: options.tickLower,
            tickUpper: options.tickUpper,
            base: options.baseType,
            baseAmount: options.baseTokenAmount,
            otherAmountMax: options.quoteTokenAmount,
        });
    }
    async addLiquidity(options) {
        return this._chain.addLiquidityInstructions(options);
    }
    /**
     * Decrease liquidity
     * @param nftMint
     * @returns
     */
    async decreaseLiquidity(walletAddress, nftMint, decreasePercentage) {
        const _nftMint = new PublicKey(nftMint);
        const positionInfo = await this._chain.getRawPositionInfoByNftMint(_nftMint);
        if (!positionInfo) {
            throw new Error('Position not found');
        }
        const { liquidity } = positionInfo;
        const liquidityToDecrease = liquidity.mul(new BN(decreasePercentage)).div(new BN(100));
        const params = {
            userAddress: walletAddress,
            nftMint: _nftMint,
            liquidity: liquidityToDecrease,
        };
        const { transaction } = await this._chain.decreaseLiquidityInstructions(params);
        return transaction;
    }
    /**
     * Remove all liquidity
     * @param userAddress
     * @param nftMint
     */
    async removeFullLiquidity(userAddress, nftMint) {
        const _nftMint = new PublicKey(nftMint);
        const { transaction } = await this._chain.decreaseFullLiquidityInstructions({
            userAddress: new PublicKey(userAddress),
            nftMint: _nftMint,
        });
        return transaction;
    }
}
