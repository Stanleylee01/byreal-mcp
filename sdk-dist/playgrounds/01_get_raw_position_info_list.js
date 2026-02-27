"use strict";
/**
 * Get the list of positions for a specified user (on-chain way)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("./config.js");
async function main() {
    // Get the list of positions for a specified user
    console.log('userAddress =>', config_js_1.userAddress.toBase58());
    const positionList = await config_js_1.chain.getRawPositionInfoListByUserAddress(config_js_1.userAddress);
    console.log(positionList);
}
main();
