"use strict";
/**
 * User manually inputs the amount of token to be decreased, and calculates the amount of token to be decreased on the other side
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
    const sqrtPriceLowerX64 = index_js_1.SqrtPriceMath.getSqrtPriceX64FromTick(tickLower);
    const sqrtPriceUpperX64 = index_js_1.SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper);
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(positionInfo.poolId);
    const amounts = index_js_1.LiquidityMath.getAmountsFromLiquidity(poolInfo.sqrtPriceX64, sqrtPriceLowerX64, sqrtPriceUpperX64, liquidity, true);
    console.log('Amount of tokenA in the position:', new decimal_js_1.Decimal(amounts.amountA.toString()));
    console.log('Amount of tokenB in the position:', new decimal_js_1.Decimal(amounts.amountB.toString()));
    console.log('==== User manually inputs the amount of token to be decreased ====');
    // For example, decrease 70% of the liquidity
    const userInputAmountA = amounts.amountA.mul(new bn_js_1.default(70)).div(new bn_js_1.default(100));
    const userGetAmountB = index_js_1.LiquidityMath.getAmountBFromAmountA(sqrtPriceLowerX64, sqrtPriceUpperX64, poolInfo.sqrtPriceX64, userInputAmountA);
    console.log(`After inputting the amount of tokenA: ${new decimal_js_1.Decimal(userInputAmountA.toString())} , the estimated amount of tokenB: ${new decimal_js_1.Decimal(userGetAmountB.toString())}`);
    const decreaseLiquidity = index_js_1.LiquidityMath.getLiquidityFromTokenAmounts(poolInfo.sqrtPriceX64, sqrtPriceLowerX64, sqrtPriceUpperX64, userInputAmountA, userGetAmountB);
    console.log('Decrease ratio:', new decimal_js_1.Decimal(decreaseLiquidity.toString()).div(new decimal_js_1.Decimal(liquidity.toString())).toFixed(2));
    // const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
    //   poolInfo.sqrtPriceX64,
    //   sqrtPriceLowerX64,
    //   sqrtPriceUpperX64,
    //   amountA,
    //   amountB,
    // );
    // const amounts = LiquidityMath.getAmountsFromLiquidity(
    //   poolInfo.sqrtPriceX64,
    //   sqrtPriceLowerX64,
    //   sqrtPriceUpperX64,
    //   liquidity,
    //   true,
    // );
    // console.log("Estimated liquidity amount:", new Decimal(liquidity.toString()));
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
