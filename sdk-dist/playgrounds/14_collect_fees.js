"use strict";
/**
 * Collect fees from the specified position
 */
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const config_js_1 = require("./config.js");
async function main() {
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('CVqLrFi5n3HLzRJdGHdChtoXhycNeveShYkmGfeaXGHC');
    const txid = await config_js_1.chain.collectFees({
        userAddress: config_js_1.userAddress,
        nftMint,
        signerCallback: config_js_1.signerCallback,
    });
    console.log('Collect fees successfully, txid:', txid);
}
main();
