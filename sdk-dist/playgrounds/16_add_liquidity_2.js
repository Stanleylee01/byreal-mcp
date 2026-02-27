"use strict";
/**
 * Add liquidity to an existing position (user inputs the amount of TokenA, and calculates the amount of TokenB needed)
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
    // step 1: Select the position to add liquidity
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('CjouQkvVP5XkABWYQYzCAJMpB3g8yJhADtRcRtEZTj8M');
    const positionInfo = await config_js_1.chain.getPositionInfoByNftMint(nftMint);
    if (!positionInfo) {
        console.error('Position does not exist');
        return;
    }
    console.log('========= step 1: Select the position =========');
    console.log('Position NFT address:', nftMint.toBase58());
    console.log(`Price range: ${positionInfo.uiPriceLower} - ${positionInfo.uiPriceUpper}`);
    console.log(`Current TokenA: ${positionInfo.tokenA.uiAmount}`);
    console.log(`Current TokenB: ${positionInfo.tokenB.uiAmount}`);
    // step 2: User inputs the amount of TokenA and the token type (TokenA as an example)
    const base = 'MintA';
    const baseAmount = new bn_js_1.default(1000000);
    // Get the pool information for calculation
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(positionInfo.rawPositionInfo.poolId);
    // Calculate the amount of TokenB needed
    const amountB = config_js_1.chain.getAmountBFromAmountA({
        priceLower: new decimal_js_1.Decimal(positionInfo.uiPriceLower),
        priceUpper: new decimal_js_1.Decimal(positionInfo.uiPriceUpper),
        amountA: baseAmount,
        poolInfo,
    });
    // Add a 2% slippage
    const amountBWithSlippage = new bn_js_1.default(amountB).mul(new bn_js_1.default(10000 * (1 + 0.02))).div(new bn_js_1.default(10000));
    console.log('========= step 2: User inputs the amount of TokenA and the token type =========');
    console.log('Amount of TokenA to be added =>', Number(baseAmount.toString()) / 10 ** positionInfo.tokenB.decimals);
    console.log('Estimated amount of TokenB needed =>', Number(amountB.toString()) / 10 ** positionInfo.tokenA.decimals);
    // Signer callback
    const signerCallback = async (tx) => {
        tx.sign([config_js_1.userKeypair]);
        return tx;
    };
    console.log('======= step 3: After confirming that there is no error, start adding liquidity =======');
    try {
        const txid = await config_js_1.chain.addLiquidity({
            userAddress: config_js_1.userAddress,
            nftMint,
            base,
            baseAmount,
            otherAmountMax: amountBWithSlippage,
            signerCallback,
        });
        console.log('Add liquidity successfully, txid:', txid);
    }
    catch (error) {
        console.error('Add liquidity failed:', error);
    }
}
main();
