"use strict";
/**
 * Decrease liquidity proportionally, and display the estimated tokenA and tokenB amounts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = require("decimal.js");
const index_js_1 = require("../index.js");
const config_js_1 = require("./config.js");
async function main() {
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('CjouQkvVP5XkABWYQYzCAJMpB3g8yJhADtRcRtEZTj8M');
    const positionInfo = await config_js_1.chain.getRawPositionInfoByNftMint(nftMint);
    if (!positionInfo) {
        throw new Error('Position not found');
    }
    const { liquidity, tickLower, tickUpper } = positionInfo;
    const decreasePercentage = 50; // decrease 50% of the liquidity
    const liquidityToDecrease = liquidity.mul(new bn_js_1.default(decreasePercentage)).div(new bn_js_1.default(100));
    console.log('Current liquidity amount:', liquidity.toString());
    console.log('Liquidity to decrease:', liquidityToDecrease.toString());
    const sqrtPriceLowerX64 = index_js_1.SqrtPriceMath.getSqrtPriceX64FromTick(tickLower);
    const sqrtPriceUpperX64 = index_js_1.SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper);
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(positionInfo.poolId);
    const amounts = index_js_1.LiquidityMath.getAmountsFromLiquidity(poolInfo.sqrtPriceX64, sqrtPriceLowerX64, sqrtPriceUpperX64, liquidityToDecrease, true);
    console.log('Estimated tokenA amount:', new decimal_js_1.Decimal(amounts.amountA.toString())
        .div(new decimal_js_1.Decimal(10 ** poolInfo.mintDecimalsA))
        .toFixed(poolInfo.mintDecimalsA));
    console.log('Estimated tokenB amount:', new decimal_js_1.Decimal(amounts.amountB.toString())
        .div(new decimal_js_1.Decimal(10 ** poolInfo.mintDecimalsB))
        .toFixed(poolInfo.mintDecimalsB));
    // const txid = chain.decreaseLiquidity({
    //   userAddress,
    //   nftMint,
    //   // Decrease half of the liquidity
    //   liquidity: liquidityToDecrease,
    //   signerCallback,
    // });
    // console.log(txid);
}
main();
