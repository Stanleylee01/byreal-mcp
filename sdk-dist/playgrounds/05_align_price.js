"use strict";
/**
 * Round the price to the price of the corresponding tick (used when creating a position)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const config_js_1 = require("./config.js");
async function main() {
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.SOL_USDC);
    const userInputPriceLower = 120;
    const userInputPriceUpper = 160;
    // When creating a position, round the price to the price of the corresponding tick
    const roundPriceLower = config_js_1.chain.alignPriceToTickPrice(new decimal_js_1.Decimal(userInputPriceLower), poolInfo);
    const roundPriceUpper = config_js_1.chain.alignPriceToTickPrice(new decimal_js_1.Decimal(userInputPriceUpper), poolInfo);
    console.log(`User input price: ${userInputPriceLower} - ${userInputPriceUpper}`);
    console.log(`Aligned to tick price: ${roundPriceLower} - ${roundPriceUpper}`);
}
main();
