"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Get the position information corresponding to the NFT mint address (on-chain way)
 */
const web3_js_1 = require("@solana/web3.js");
const config_js_1 = require("./config.js");
async function main() {
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('2GfNC4r784awMFDW2d1RDDebTzStTY6aMr78K5Q6DGyM');
    // Get the position information corresponding to the NFT mint address
    const positionInfo = await config_js_1.chain.getRawPositionInfoByNftMint(nftMint);
    console.log(positionInfo);
}
main();
