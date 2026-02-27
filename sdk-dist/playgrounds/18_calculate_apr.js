"use strict";
/**
 * Calculate the annualized return when adding liquidity
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = require("decimal.js");
const index_js_1 = require("../index.js");
const config_js_1 = require("./config.js");
async function main() {
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.SOL_USDC);
    // mock data
    const volume24h = 91114900; // data from server
    const feeRate = 0.0002; // fee rate from server
    const solUsdValue = 166.82; // current sol price in USD, from server
    // User input price range
    const userStartPrice = '150';
    const userEndPrice = '190';
    const uiAmountA = '100';
    const amountA = new bn_js_1.default(new decimal_js_1.Decimal(uiAmountA).mul(new decimal_js_1.Decimal(10 ** poolInfo.mintDecimalsA)).toFixed(0));
    const priceInTickLower = index_js_1.TickMath.getTickAlignedPriceDetails(new decimal_js_1.Decimal(userStartPrice), poolInfo.tickSpacing, poolInfo.mintDecimalsA, poolInfo.mintDecimalsB);
    const priceInTickUpper = index_js_1.TickMath.getTickAlignedPriceDetails(new decimal_js_1.Decimal(userEndPrice), poolInfo.tickSpacing, poolInfo.mintDecimalsA, poolInfo.mintDecimalsB);
    // Calculate the amount of tokenB needed
    const amountB = config_js_1.chain.getAmountBFromAmountA({
        priceLower: priceInTickLower.price,
        priceUpper: priceInTickUpper.price,
        amountA,
        poolInfo,
    });
    const uiAmountB = new decimal_js_1.Decimal(amountB.toString()).div(new decimal_js_1.Decimal(10 ** poolInfo.mintDecimalsB)).toString();
    // console.log('amountA ==> ', amountA.toString());
    // console.log('amountB ==> ', amountB.toString());
    // console.log('uiAmountA ==> ', uiAmountA);
    // console.log('uiAmountB ==> ', uiAmountB);
    const positionUsdValue = Number(uiAmountA) * solUsdValue + Number(uiAmountB);
    const apr = await config_js_1.chain.calculateApr({
        volume24h,
        feeRate,
        positionUsdValue,
        amountA,
        amountB,
        tickLower: priceInTickLower.tick,
        tickUpper: priceInTickUpper.tick,
        poolInfo,
        scene: 'create',
    });
    console.log('Annualized return:', apr);
}
main();
