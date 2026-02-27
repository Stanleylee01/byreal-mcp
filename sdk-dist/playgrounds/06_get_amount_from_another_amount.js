"use strict";
/**
 * Round the price to the price of the corresponding tick (used when creating a position)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = require("decimal.js");
const config_js_1 = require("./config.js");
async function main() {
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.SOL_USDC);
    const userInputPriceLower = 120;
    const userInputPriceUpper = 160;
    const userInputAmountA = new bn_js_1.default(1000000000); // 1 SOL
    // Calculate the amount of tokenB needed to be invested in the specified price range after the specified tokenA amount has been invested
    const amountB = config_js_1.chain.getAmountBFromAmountA({
        priceLower: new decimal_js_1.Decimal(userInputPriceLower),
        priceUpper: new decimal_js_1.Decimal(userInputPriceUpper),
        amountA: userInputAmountA,
        poolInfo,
    });
    // Tips: This is the amount of tokens that will be accurately invested in the vault pool;
    console.log('Estimated amount of tokenB to be invested =>', Number(amountB.toString()) / 10 ** poolInfo.mintDecimalsB);
}
main();
