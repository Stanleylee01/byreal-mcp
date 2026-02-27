"use strict";
/**
 * Get the on-chain information of the specified pool
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("./config.js");
async function main() {
    // Get the on-chain information of the specified pool
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.SOL_USDC);
    console.log(poolInfo);
}
main();
