"use strict";
/**
 * Get the position information corresponding to the NFT mint address
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("./config.js");
async function main() {
    console.log('userAddress ==>', config_js_1.userAddress.toBase58());
    // Get the list of positions for a specified user
    const positionList = await config_js_1.chain.getRawPositionInfoListByUserAddress(config_js_1.userAddress);
    const nftMints = positionList.map((position) => position.nftMint);
    for (const nftMint of nftMints) {
        const positionInfo = await config_js_1.chain.getPositionInfoByNftMint(nftMint);
        if (!positionInfo)
            continue;
        const { uiPriceLower, uiPriceUpper, tokenA, tokenB } = positionInfo;
        console.log(`\n=========== Position information ===========`);
        console.log(`NFT mint address: ${nftMint.toBase58()}`);
        console.log(`Price range: ${uiPriceLower} - ${uiPriceUpper}`);
        console.log(`Liquidity assets:`);
        console.log(`  TokenA(${positionInfo.tokenA.address.toBase58().slice(0, 4)}...${positionInfo.tokenA.address
            .toBase58()
            .slice(-4)}):`);
        console.log(`    • Amount: ${tokenA.uiAmount}`);
        console.log(`    • Fee income: ${tokenA.uiFeeAmount}`);
        console.log(`  TokenB(${tokenB.address.toBase58().slice(0, 4)}...${tokenB.address.toBase58().slice(-4)}):`);
        console.log(`    • Amount: ${tokenB.uiAmount}`);
        console.log(`    • Fee income: ${tokenB.uiFeeAmount}`);
    }
}
main();
