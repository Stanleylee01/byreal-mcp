"use strict";
/**
 * Calculate the annualized return when adding liquidity
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = require("decimal.js");
const config_js_1 = require("./config.js");
async function main() {
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.SOL_USDC);
    // mock data
    const volume24h = 33860684; // data from server
    const feeRate = 0.0002; // fee rate from server
    const solUsdValue = 170.23; // current sol price in USD, from server
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('2eBDwL4zU1gR2oPbDDaawbYZHkoZXwQeFP1Th9Pn8DbC');
    const positionInfo = await config_js_1.chain.getPositionInfoByNftMint(nftMint);
    if (!positionInfo) {
        throw new Error('positionInfo is null');
    }
    const amountB = new bn_js_1.default(1000000 * 1); // 1 USDC
    const amountA = config_js_1.chain.getAmountAFromAmountB({
        priceLower: new decimal_js_1.Decimal(positionInfo.uiPriceLower),
        priceUpper: new decimal_js_1.Decimal(positionInfo.uiPriceUpper),
        amountB,
        poolInfo,
    });
    const uiAmountA = Number(amountA) / 10 ** positionInfo.tokenA.decimals;
    const uiAmountB = Number(amountB) / 10 ** positionInfo.tokenB.decimals;
    const existPositionUsdValue = Number(positionInfo.tokenA.uiAmount) * solUsdValue + Number(positionInfo.tokenB.uiAmount);
    const newPositionUsdValue = Number(uiAmountA) * solUsdValue + Number(uiAmountB);
    console.log(`User already has position information: TokenA: ${positionInfo.tokenA.uiAmount}, TokenB: ${positionInfo.tokenB.uiAmount}, USD value: ${existPositionUsdValue}`);
    console.log(`User is going to invest: TokenA: ${uiAmountA}, TokenB: ${uiAmountB}, USD value: ${newPositionUsdValue}`);
    const existLiquidity = positionInfo.rawPositionInfo.liquidity;
    console.log(`User already has liquidity: ${existLiquidity}`);
    const positionUsdValue = newPositionUsdValue + existPositionUsdValue;
    console.log(`USD value of the position: ${positionUsdValue}`);
    const apr = await config_js_1.chain.calculateApr({
        volume24h,
        feeRate,
        positionUsdValue,
        amountA, // User is going to invest TokenA
        amountB, // User is going to invest TokenB
        tickLower: positionInfo.rawPositionInfo.tickLower,
        tickUpper: positionInfo.rawPositionInfo.tickUpper,
        // When adding liquidity, you need to pass in the existing liquidity
        existLiquidity: positionInfo.rawPositionInfo.liquidity,
        poolInfo,
        scene: 'add',
    });
    console.log('Estimated annualized return:', apr);
}
main();
