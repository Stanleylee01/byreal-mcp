"use strict";
/**
 * Remove all liquidity from the position, and close the position
 */
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const config_js_1 = require("./config.js");
async function main() {
    const nftMint = new web3_js_1.PublicKey('3eunC8kdMEwBRQHd91cyQ36FVQFXDuicGk7xuVS6hFfk');
    const txid = await config_js_1.chain.decreaseFullLiquidity({
        userAddress: config_js_1.userAddress,
        nftMint,
        signerCallback: config_js_1.signerCallback,
    });
    console.log('Decrease liquidity successfully, txid:', txid);
}
main();
