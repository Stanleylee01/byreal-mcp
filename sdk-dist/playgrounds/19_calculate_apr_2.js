"use strict";
/**
 * Calculate the annualized return when adding liquidity
 */
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const config_js_1 = require("./config.js");
async function main() {
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.SOL_USDC);
    // mock data
    const volume24h = 33860684; // data from server
    const feeRate = 0.0002; // fee rate from server
    const solUsdValue = 166.82; // current sol price in USD, from server
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('3piGZRqykLKmKob42id8E61NnHqyrhWE2kziWmHZ7zqV');
    const positionInfo = await config_js_1.chain.getPositionInfoByNftMint(nftMint);
    if (!positionInfo) {
        throw new Error('positionInfo is null');
    }
    const positionUsdValue = Number(positionInfo.tokenA.uiAmount) * solUsdValue + Number(positionInfo.tokenB.uiAmount);
    const apr = await config_js_1.chain.calculateApr({
        volume24h,
        feeRate,
        positionUsdValue,
        amountA: positionInfo.tokenA.amount,
        amountB: positionInfo.tokenB.amount,
        tickLower: positionInfo.rawPositionInfo.tickLower,
        tickUpper: positionInfo.rawPositionInfo.tickUpper,
        poolInfo,
    });
    console.log('Annualized return:', apr);
}
main();
